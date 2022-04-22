import { MigrationInterface, QueryRunner } from 'typeorm'

export class addMatchFacrUuid1650554984867 implements MigrationInterface {
    name = 'addMatchFacrUuid1650554984867'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`failed_new_match_request\` ADD \`matchFacrUuid\` varchar(255) NOT NULL`,
        )
        await queryRunner.query(`ALTER TABLE \`match\` ADD \`facrUuid\` varchar(255) NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`match\` DROP COLUMN \`facrUuid\``)
        await queryRunner.query(
            `ALTER TABLE \`failed_new_match_request\` DROP COLUMN \`matchFacrUuid\``,
        )
    }
}
