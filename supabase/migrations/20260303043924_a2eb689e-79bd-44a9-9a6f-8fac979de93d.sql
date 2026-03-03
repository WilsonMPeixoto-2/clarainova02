ALTER TABLE public.document_chunks
ADD CONSTRAINT document_chunks_doc_chunk_unique
UNIQUE (document_id, chunk_index);