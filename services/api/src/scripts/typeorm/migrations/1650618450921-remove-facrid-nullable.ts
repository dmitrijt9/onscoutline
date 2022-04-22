import { MigrationInterface, QueryRunner } from 'typeorm'

export class removeFacridNullable1650618450921 implements MigrationInterface {
    name = 'removeFacridNullable1650618450921'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`club\` CHANGE \`facrId\` \`facrId\` varchar(255) NOT NULL`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`facrId\` \`facrId\` varchar(255) NOT NULL`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` CHANGE \`facrId\` \`facrId\` varchar(255) NULL`,
        )
        await queryRunner.query(
            `ALTER TABLE \`club\` CHANGE \`facrId\` \`facrId\` varchar(255) NULL`,
        )
    }
}
