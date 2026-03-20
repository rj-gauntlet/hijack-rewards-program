import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantFreezeDto {
  @ApiProperty({ example: 'streak-001' })
  @IsString()
  playerId!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  count!: number;

  @ApiProperty({ example: 'Support compensation', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
