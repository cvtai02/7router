import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { CreateBucketUseCase } from "../usecases/create-bucket.usecase";

@Controller("files")
export class CreateBucketApi {
  constructor(private readonly createBucket: CreateBucketUseCase) {}

  @Post("bucket")
  @HttpCode(204)
  async create(@Body() body: { accountPath: string; bucketName: string }): Promise<void> {
    await this.createBucket.execute(body.accountPath, body.bucketName);
  }
}
