import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('processed_messages')
export class ProcessedMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  messageId!: string;

  @Column({ type: 'timestamp' })
  processedAt!: Date;

  @Column({ type: 'varchar', length: 64 })
  orderId!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  handler!: string | null;
}
