import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AwardPointsDto {
  @ApiProperty({ description: 'Player UUID', example: 'p1-uuid-0001' })
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @ApiProperty({ description: 'Game table identifier', example: 'table-001' })
  @IsString()
  @IsNotEmpty()
  tableId!: string;

  @ApiProperty({ description: 'Table stakes label', example: '$1.00-$2.00' })
  @IsString()
  @IsNotEmpty()
  tableStakes!: string;

  @ApiProperty({ description: 'Big blind amount in dollars', example: 1.0 })
  @IsNumber()
  @Min(0.01)
  bigBlind!: number;

  @ApiProperty({ description: 'Unique hand identifier', example: 'hand-abc-123' })
  @IsString()
  @IsNotEmpty()
  handId!: string;
}
