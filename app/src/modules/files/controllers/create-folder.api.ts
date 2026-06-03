import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { CreateFolderUseCase } from "../usecases/create-folder.usecase";

@Controller("files")
export class CreateFolderApi {
  constructor(private readonly createFolder: CreateFolderUseCase) {}

  @Post("folder")
  @HttpCode(204)
  async create(@Body() body: { parentPath: string; folderName: string }): Promise<void> {
    await this.createFolder.execute(body.parentPath, body.folderName);
  }
}
