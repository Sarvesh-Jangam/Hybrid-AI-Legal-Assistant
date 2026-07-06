# ---- Stage 1: Builder ----
FROM python:3.12-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    tesseract-ocr \
    poppler-utils \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY newReq.txt .

RUN pip install --prefix=/install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cpu \
    -r newReq.txt

# ---- Stage 2: Runtime ----
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]