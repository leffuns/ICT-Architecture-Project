FROM alpine:3.19

# Installeer curl voor HTTP requests en hey voor load testing
RUN apk add --no-cache curl bash \
    && wget -q https://storage.googleapis.com/hey-releases/hey_linux_amd64 \
       -O /usr/local/bin/hey \
    && chmod +x /usr/local/bin/hey

WORKDIR /loadtest

COPY run-test.sh .
RUN chmod +x run-test.sh

# Container blijft draaien zodat je er handmatig in kan exec-en
CMD ["tail", "-f", "/dev/null"]
