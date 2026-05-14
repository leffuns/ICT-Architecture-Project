FROM python:3.12-slim

# Installeer curl voor de health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installeer dependencies apart voor Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Gebruik gunicorn als productie-WSGI server
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
