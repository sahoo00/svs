#include "stdio.h"
typedef char boolean;		/* must be char for compatibility */
#define HAVE_BOOLEAN
#include "jpeglib.h"
#include "jerror.h"
#include "stdlib.h"

typedef unsigned int uint32;
typedef UINT8 uint8;

int convertRGBAtoJPEG(uint32 *raster, uint32 w, uint32 h, char *filename) {
  struct jpeg_compress_struct cinfo;
  struct jpeg_error_mgr jerr;
  FILE * outfile;		/* target file */
  JSAMPROW row_pointer[1];
  int row_stride;	/* physical row width in image buffer */
  int quality = 95;
  uint32 x, y;

  cinfo.err = jpeg_std_error(&jerr);
  jpeg_create_compress(&cinfo);
  if (filename == NULL) {
     outfile = stdout;
  }
  else if ((outfile = fopen(filename, "wb")) == NULL) {
    fprintf(stderr, "can't open %s\n", filename);
    exit(1);
  }
  jpeg_stdio_dest(&cinfo, outfile);
  cinfo.image_width = w;  /* image width and height, in pixels */
  cinfo.image_height = h;
  cinfo.input_components = 3;	/* # of color components per pixel */
  cinfo.in_color_space = JCS_RGB;	    /* colorspace of input image */
  jpeg_set_defaults(&cinfo);
  jpeg_set_quality(&cinfo, quality, TRUE);
  jpeg_start_compress(&cinfo, TRUE);
  row_stride = w * 3;	/* JSAMPLEs per row in image_buffer */
  uint8 *linebuffer = (uint8*) malloc(row_stride * sizeof (uint8));
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      uint8 * ptr = (uint8*) &raster[y * w + x];
      linebuffer[x * 3] = ptr[0]; // r
      linebuffer[x * 3 + 1] = ptr[1]; // g
      linebuffer[x * 3 + 2] = ptr[2]; // b
      //printf("%d %d %d\n", ptr[0], ptr[1], ptr[2]);
    }
    row_pointer[0] = &linebuffer[0];
    (void) jpeg_write_scanlines(&cinfo, row_pointer, 1);
  }
  free(linebuffer);

  jpeg_finish_compress(&cinfo);
  fclose(outfile);
  jpeg_destroy_compress(&cinfo);
  return 0;
}

