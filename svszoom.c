#include "stdlib.h"
#include "tiffio.h"
#include "string.h"

int convertRGBAtoJPEG(uint32 *raster, uint32 w, uint32 h, char *filename);

int main(int argc, char* argv[])
{
  if (argc <= 1) {
    printf("Usage: %s <cmd> <args>\n", argv[0]);
    return 0;
  }
  if (strcmp(argv[1], "size") == 0) {
    TIFF* tif;
    if (argc <= 2) {
      printf("Usage: %s size <file>\n", argv[0]);
      return 0;
    }
    tif = TIFFOpen(argv[2], "r");
    if (tif) {
      uint32 imageWidth, imageLength;
      TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, &imageWidth);
      TIFFGetField(tif, TIFFTAG_IMAGELENGTH, &imageLength);
      printf("%d %d\n", imageWidth, imageLength);
    }
    else {
      printf("Error\n");
    }
    return 0;
  }
  if (strcmp(argv[1], "zoom") == 0) {
    TIFF* tif;
    int32 x, y;
    uint32 w, h, sw, sh;
    uint32 imageWidth, imageLength, iw, il, maxi;
    uint16 i, numDir;
    char *desc, *ptr;
    float f, fi, maxf;
    uint32 *raster;
    char *filename = NULL;

    if (argc <= 8) {
      printf("Usage: %s zoom <file> x y w h sw sh\n", argv[0]);
      return 0;
    }
    tif = TIFFOpen(argv[2], "r");
    x = atoi(argv[3]);
    y = atoi(argv[4]);
    w = atoi(argv[5]);
    h = atoi(argv[6]);
    sw = atoi(argv[7]);
    sh = atoi(argv[8]);
    if (argc > 9) {
      filename = strdup(argv[9]);
    }
    if (tif) {
      TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, &imageWidth);
      TIFFGetField(tif, TIFFTAG_IMAGELENGTH, &imageLength);
      //printf("%d %d %dx%d %dx%d %dx%d\n", x, y, w, h, sw, sh, imageWidth, imageLength);
      if (w < sw) { w = sw; }
      if (h < sh) { h = sh; }
      f = w * 1.0 /sw;
      if (f < (h * 1.0 /sh)) { f = h * 1.0 /sh; }
      //printf("%d %d\n", (int)(f * sw - w)/2, (int)(f * sh - h)/2);
      x = x - (int)((f * sw - w)/2);
      y = y - (int)((f * sh - h)/2);
      w = f * sw;
      h = f * sh;
      printf("%d %d %d %d %d %d %f\n", x, y, w, h, sw, sh, f);
      numDir = TIFFNumberOfDirectories(tif);
      maxf = 1; maxi = 0;
      for (i = 0; i < numDir; i++) {
	TIFFSetDirectory(tif, i);
	TIFFGetField(tif, TIFFTAG_IMAGEDESCRIPTION, &desc);
	ptr = desc;
	while (ptr[0] != '\r' && ptr[0] != '\n') { ptr++; }
	while (ptr[0] == '\r' || ptr[0] == '\n') { ptr++; }
	if (strncmp(ptr, "label", 5) == 0 || strncmp(ptr, "macro", 5) == 0) {
	  continue;
	}
	TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, &iw);
	TIFFGetField(tif, TIFFTAG_IMAGELENGTH, &il);
	fi = imageWidth * 1.0 /iw;
	if (fi < (imageLength * 1.0 /il)) { fi = imageLength * 1.0 /il; }
	//printf("%d %d f = %f %s\n", iw, il, fi, ptr);
	if (fi < f && maxf < fi) { maxf = fi; maxi = i; }
      }
      printf("%f %d\n", maxf, maxi);
      TIFFSetDirectory(tif, maxi);
      TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, &iw);
      TIFFGetField(tif, TIFFTAG_IMAGELENGTH, &il);
      x /= maxf; y /= maxf; w /= maxf; h /=maxf; f /= maxf;
      printf("x=%d y=%d w x h = %dx%d sw x sh = %dx%d f = %f\n", x, y, w, h, sw, sh, f);
      raster = (uint32*) _TIFFmalloc(w * h * sizeof (uint32));
      if (TIFFIsTiled(tif)) {
	uint32 tW, tL;
	int32 x1, y1, x2, y2;
	uint32 *buf;

	TIFFGetField(tif, TIFFTAG_TILEWIDTH, &tW);
	TIFFGetField(tif, TIFFTAG_TILELENGTH, &tL);
	printf("Tiled tW x tL = %dx%d iw x il =%dx%d\n", tW, tL, iw, il);
	buf = _TIFFmalloc(tW * tL * sizeof (uint32));
	for (y1 = y; y1 < (int32)(y+h+tL); y1 += tL) {
	  int32 ty = y1/tL * tL;
	  if (ty < 0 || ty >= (int32)(y + h) || ty >= il) { continue; }
	  for (x1 = x; x1 < (int32)(x+w+tW); x1 += tW) {
	    int32 tx = x1/tW * tW;
	    if (tx < 0 || tx >= (int32)(x + w) || tx >= iw) { continue; }
	    //printf("tx=%d ty=%d tW=%d tL=%d x1=%d y1=%d\n", tx, ty, tW, tL, x1, y1);
	    TIFFReadRGBATile(tif, tx, ty, buf);
	    for (y2 = ty; y2 < (ty + tL); y2++) {
	      if (y2 < y || y2 >= (int32)(y + h)) { continue; }
	      for (x2 = tx; x2 < (tx + tW); x2++) {
		if (x2 < x || x2 >= (int32)(x + w)) { continue; }
		if (x2 >= (int32)(iw)) { continue; }
		raster[(y2-y) * w+(x2-x)] = buf[(tL-y2+ty-1) * tW+(x2-tx)];
		//uint8 * ptr = (uint8*) &raster[(y2-y) * w+(x2-x)];
		//printf("R=%d G=%d B=%d\n", ptr[0], ptr[1], ptr[2]);
	      }
	    }
	  }
	}
	_TIFFfree(buf);
      }
      else { // Stripped
	uint32 rs;
	int32 y1, x2, y2;
	uint32 *buf;

	TIFFGetFieldDefaulted(tif, TIFFTAG_ROWSPERSTRIP, &rs);
	printf("Stripped %dx%d %d\n", iw, rs, il);

	buf = _TIFFmalloc(iw * rs * sizeof (uint32));
	for (y1 = y; y1 < (int32)(y+h+rs); y1 += rs) {
	  int32 ty = y1/rs * rs;
	  if (ty < 0 || ty >= (int32)(y + h) || ty >= il) { continue; }
	  //printf("ty=%d y1=%d\n", ty, y1);
	  TIFFReadRGBAStrip(tif, ty, buf);
	  for (y2 = ty; y2 < (ty + rs); y2++) {
	    if (y2 < y || y2 >= (y + h)) { continue; }
	    for (x2 = x; x2 < (int32)(x + w); x2++) {
	      if (x2 < 0 || x2 >= (int32)(iw)) { continue; }
	      raster[(y2-y) * w+(x2-x)] = buf[(rs-y2+ty-1) * iw+x2];
	    }
	  }
	}
	_TIFFfree(buf);
      }
      TIFFClose(tif);
      convertRGBAtoJPEG(raster, w, h, filename);
      _TIFFfree(raster);
    }
    else {
      printf("Error\n");
    }
    return 0;
  }
  return 1;
}
