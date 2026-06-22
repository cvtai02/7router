import { Controller, Get, Query, Res, UnauthorizedException } from "@nestjs/common";
import { PublicRoute } from "../../auth/public-route.decorator";
import { StreamFileUseCase } from "../usecases/stream-file.usecase";

interface RawResponse {
  status(code: number): RawResponse;
  json(body: unknown): void;
  set(headers: Record<string, string>): void;
  send(body: Buffer): void;
}

@Controller("files")
export class StreamFileApi {
  constructor(private readonly streamFile: StreamFileUseCase) {}

  @Get("stream")
  @PublicRoute()
  async stream(
    @Query("path") path: string,
    @Query("token") token: string,
    @Res() res: RawResponse,
  ): Promise<void> {
    if (!token) throw new UnauthorizedException("Token required.");
    if (!path) {
      res.status(400).json({ statusCode: 400, message: "path query parameter required." });
      return;
    }

    const result = await this.streamFile.execute(path, token);
    const buffer = Buffer.from(result.contentBase64, "base64");

    res.set({
      "Content-Type": result.contentType || "application/octet-stream",
      "Content-Length": buffer.length.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
    });
    res.send(buffer);
  }
}
