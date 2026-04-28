import { Controller, Get, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateSettingsSchema, type UpdateSettingsDto } from './settings.schema';
import { SettingsResponseDto, UpdateSettingsRequestDto } from './settings.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current system settings' })
  @ApiResponse({ status: 200, description: 'Current settings', type: SettingsResponseDto })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update system settings' })
  @ApiBody({ type: UpdateSettingsRequestDto })
  @ApiResponse({ status: 200, description: 'Updated settings', type: SettingsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid settings values' })
  updateSettings(
    @Body(new ZodValidationPipe(updateSettingsSchema))
    body: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(body);
  }
}
