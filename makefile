.PHONY: all
all: build clean

.PHONY: clean
clean:
	rm -f server.wasm

.PHONY: build
build:
	GOOS=js GOARCH=wasm go build -o server.wasm .