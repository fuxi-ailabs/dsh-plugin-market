#include <png.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
    if (argc != 2) return 2;
    png_image image;
    memset(&image, 0, sizeof image);
    image.version = PNG_IMAGE_VERSION;
    if (!png_image_begin_read_from_file(&image, argv[1])) {
        fprintf(stderr, "%s\n", image.message);
        return 1;
    }
    image.format = PNG_FORMAT_RGBA;
    png_bytep pixels = malloc(PNG_IMAGE_SIZE(image));
    if (!pixels || !png_image_finish_read(&image, NULL, pixels, 0, NULL)) {
        fprintf(stderr, "%s\n", image.message);
        free(pixels);
        png_image_free(&image);
        return 1;
    }
    int valid = image.width == 2 && image.height == 2 &&
                pixels[0] == 255 && pixels[1] == 0 && pixels[2] == 0 && pixels[3] == 255;
    printf("libpng %s: PNG %ux%u RGBA; first pixel %u,%u,%u,%u; %s\n",
           PNG_LIBPNG_VER_STRING, image.width, image.height,
           pixels[0], pixels[1], pixels[2], pixels[3], valid ? "PASS" : "FAIL");
    free(pixels);
    png_image_free(&image);
    return valid ? 0 : 1;
}
