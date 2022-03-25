import { MigrationInterface, QueryRunner } from 'typeorm'

export class clubFacrIdNullable1648242740268 implements MigrationInterface {
    name = 'clubFacrIdNullable1648242740268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`club\` CHANGE \`facrId\` \`facrId\` varchar(255) NULL`,
        )
        await queryRunner.query(
            `ALTER TABLE \`club\` CHANGE \`facrUuid\` \`facrUuid\` varchar(255) NULL`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`club\` CHANGE \`facrUuid\` \`facrUuid\` varchar(255) NOT NULL`,
        )
        await queryRunner.query(
            `ALTER TABLE \`club\` CHANGE \`facrId\` \`facrId\` varchar(255) NOT NULL`,
        )
    }
}
