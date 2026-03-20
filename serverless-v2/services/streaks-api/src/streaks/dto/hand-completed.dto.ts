import { IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HandCompletedDto {
  @ApiProperty({ example: 'streak-001' })
  @IsString()
  playerId!: string;

  @ApiProperty({ example: 456 })
  @IsNumber()
  tableId!: number;

  @ApiProperty({ example: 'hand-789' })
  @IsString()
  handId!: string;

  @ApiProperty({ example: '2026-02-20T14:30:00Z' })
  @IsDateString()
  completedAt!: string;
}
