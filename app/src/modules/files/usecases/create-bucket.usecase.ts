import { Injectable } from "@nestjs/common";
import { CreateFolderUseCase } from "./create-folder.usecase";

@Injectable()
export class CreateBucketUseCase {
  constructor(private readonly createFolder: CreateFolderUseCase) {}

  async execute(accountPath: string, bucketName: string): Promise<void> {
    await this.createFolder.execute(accountPath, bucketName);
  }
}
