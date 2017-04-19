CC=gcc
CFLAGS=-c -Wall -g -I bigtiff/includes/
LDFLAGS=-L bigtiff -ltiff -ljpeg -lz -lm
SOURCES=svszoom.c svsjpeg.c
OBJS=$(SOURCES:.c=.o)
EXE=svszoom

all: $(SOURCES) $(EXE)

$(EXE): $(OBJS) 
	$(CC) $(OBJS) $(LDFLAGS) -o $@

.c.o:
	$(CC) $(CFLAGS) $< -o $@
clean:
	rm -f $(OBJS) $(EXE)
