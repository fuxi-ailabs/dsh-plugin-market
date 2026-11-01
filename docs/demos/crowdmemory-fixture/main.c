#include <stdio.h>
#include <string.h>
#include <zlib.h>

int main(void) {
    const char *text = "Crowd Memory: one fix, another agent.";
    unsigned char buffer[256];
    uLongf length = sizeof(buffer);
    int status = compress2(buffer, &length, (const Bytef *)text, strlen(text), Z_BEST_SPEED);
    if (status != Z_OK) return 1;
    printf("PASS: zlib compression succeeded (%lu bytes)\n", (unsigned long)length);
    return 0;
}
