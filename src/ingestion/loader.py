"""
Lexra — PDF Loader & Chunker
==============================
Reads PDF files, extracts text, splits into overlapping chunks.
Each chunk is stored with metadata (source, page, chunk_id).
"""

import os
import re
import uuid
import pymupdf  # PyMuPDF


def load_pdf(file_path: str) -> list[dict]:
    """
    Load a PDF and extract text page by page.
    Returns list of {page_num, text, source} dicts.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF not found: {file_path}")

    doc = pymupdf.open(file_path)
    pages = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()

        if text:  # skip blank pages
            pages.append({
                "page_num": page_num + 1,
                "text": text,
                "source": os.path.basename(file_path)
            })

    doc.close()
    print(f"[Loader] Loaded {len(pages)} pages from '{os.path.basename(file_path)}'")
    return pages


def clean_text(text: str) -> str:
    """
    Clean extracted PDF text:
    - Remove excessive whitespace
    - Remove form feeds and null bytes
    - Normalize line breaks
    """
    text = text.replace("\x0c", " ")   # form feed
    text = text.replace("\x00", "")    # null bytes
    text = re.sub(r"\n{3,}", "\n\n", text)  # max 2 newlines
    text = re.sub(r" {2,}", " ", text)      # max 1 space
    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> list[str]:
    """
    Split text into overlapping chunks.

    Args:
        text: Input text string
        chunk_size: Max characters per chunk
        chunk_overlap: Characters to overlap between chunks

    Returns:
        List of text chunks
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        # Try to break at sentence boundary (. or \n)
        if end < len(text):
            break_point = text.rfind(".", start, end)
            if break_point == -1:
                break_point = text.rfind("\n", start, end)
            if break_point != -1 and break_point > start:
                end = break_point + 1

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - chunk_overlap

    return chunks


def process_pdf(
    file_path: str,
    tenant_id: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> list[dict]:
    """
    Full pipeline: PDF → pages → clean → chunks → metadata

    Args:
        file_path: Path to PDF file
        tenant_id: Tenant identifier for multi-tenancy
        chunk_size: Characters per chunk
        chunk_overlap: Overlap between chunks

    Returns:
        List of chunk dicts ready for ChromaDB insertion
    """
    pages = load_pdf(file_path)
    all_chunks = []

    for page in pages:
        cleaned = clean_text(page["text"])
        chunks = chunk_text(cleaned, chunk_size, chunk_overlap)

        for i, chunk_text_content in enumerate(chunks):
            all_chunks.append({
                "id": str(uuid.uuid4()),
                "text": chunk_text_content,
                "metadata": {
                    "source": page["source"],
                    "page_num": page["page_num"],
                    "chunk_index": i,
                    "tenant_id": tenant_id,
                    "char_count": len(chunk_text_content)
                }
            })

    print(f"[Loader] Generated {len(all_chunks)} chunks from {len(pages)} pages")
    return all_chunks


if __name__ == "__main__":
    # Quick test with a dummy text file converted to check chunking logic
    sample_text = """
    This Agreement is entered into on the 1st day of January 2024.

    Section 1: Parties
    This lease agreement is between the Landlord, Mr. Sharma, and the Tenant, Mr. Gowtham.

    Section 2: Property
    The property located at 123 MG Road, Bengaluru shall be leased to the Tenant.

    Section 3: Rent
    The monthly rent shall be five thousand rupees payable on the first of every month.

    Section 14(2)(b): Subletting
    The tenant is strictly prohibited from subletting the property to any third party.

    Section 5: Termination
    Either party may terminate this agreement with thirty days written notice.
    """

    chunks = chunk_text(sample_text, chunk_size=200, chunk_overlap=30)
    print(f"\nChunking test — {len(chunks)} chunks from sample text:")
    for i, chunk in enumerate(chunks):
        print(f"\nChunk {i+1} [{len(chunk)} chars]:")
        print(f"  {chunk[:100]}...")
