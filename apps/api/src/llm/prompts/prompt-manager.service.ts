import { Injectable } from '@nestjs/common';
import { PromptContext } from '../interfaces/llm-provider.interface';
import {
  PromptAsset,
  PromptBuildContext,
  getPromptAsset,
  listPromptAssets,
} from './prompt-assets';

@Injectable()
export class PromptManager {
  getAsset(name: string): PromptAsset {
    const asset = getPromptAsset(name);
    if (!asset) {
      throw new Error(`Prompt asset not found: ${name}`);
    }
    return asset;
  }

  compose(name: string, context: PromptBuildContext): PromptContext {
    const asset = this.getAsset(name);
    return asset.build(context);
  }

  listAssets(): PromptAsset[] {
    return listPromptAssets();
  }
}
