#include <png.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int read_rgba(const char *path, png_image *image, png_bytep *pixels) {
    memset(image, 0, sizeof *image);
    image->version = PNG_IMAGE_VERSION;
    if (!png_image_begin_read_from_file(image, path)) return 0;
    image->format = PNG_FORMAT_RGBA;
    *pixels = malloc(PNG_IMAGE_SIZE(*image));
    return *pixels && png_image_finish_read(image, NULL, *pixels, 0, NULL);
}

int main(int argc, char **argv) {
    if (argc != 3) return 2;
    png_image input = {0}, output = {0};
    png_bytep original = NULL, decoded = NULL;
    int valid = 0;
    if (!read_rgba(argv[1], &input, &original)) {
        fprintf(stderr, "read: %s\n", input.message);
        goto done;
    }
    if (!png_image_write_to_file(&input, argv[2], 0, original, 0, NULL)) {
        fprintf(stderr, "write: %s\n", input.message);
        goto done;
    }
    if (!read_rgba(argv[2], &output, &decoded)) {
        fprintf(stderr, "reload: %s\n", output.message);
        goto done;
    }
    valid = input.width == output.width && input.height == output.height &&
            memcmp(original, decoded, PNG_IMAGE_SIZE(input)) == 0;
    printf("libpng %s: decode -> encode -> reload, %ux%u RGBA identical: %s\n",
           PNG_LIBPNG_VER_STRING, input.width, input.height, valid ? "PASS" : "FAIL");
done:
    free(original);
    free(decoded);
    png_image_free(&input);
    png_image_free(&output);
    return valid ? 0 : 1;
}
