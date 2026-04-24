import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateSettingsSchema, type UpdateSettingsDto } from './settings.schema';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  updateSettings(
    @Body(new ZodValidationPipe(updateSettingsSchema))
    body: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(body);
  }
}
