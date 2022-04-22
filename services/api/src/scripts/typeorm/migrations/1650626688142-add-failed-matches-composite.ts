import { MigrationInterface, QueryRunner } from 'typeorm'

export class addFailedMatchesComposite1650626688142 implements MigrationInterface {
    name = 'addFailedMatchesComposite1650626688142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`failed_new_match_request\` DROP PRIMARY KEY`)
        await queryRunner.query(`ALTER TABLE \`failed_new_match_request\` DROP COLUMN \`id\``)
        await queryRunner.query(
            `ALTER TABLE \`failed_new_match_request\` ADD PRIMARY KEY (\`matchFacrUuid\`, \`status\`)`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`failed_new_match_request\` DROP PRIMARY KEY`)
        await queryRunner.query(
            `ALTER TABLE \`failed_new_match_request\` ADD \`id\` varchar(36) NOT NULL`,
        )
        await queryRunner.query(`ALTER TABLE \`failed_new_match_request\` ADD PRIMARY KEY (\`id\`)`)
    }
}
