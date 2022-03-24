import { MigrationInterface, QueryRunner } from 'typeorm'

export class addCompetitionToMatch1647957563531 implements MigrationInterface {
    name = 'addCompetitionToMatch1647957563531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`match\` ADD \`competitionSeasonId\` varchar(36) NULL`,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` ADD CONSTRAINT \`FK_07a3958f4ebc76ea6021d314950\` FOREIGN KEY (\`competitionSeasonId\`) REFERENCES \`competition_has_season\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_07a3958f4ebc76ea6021d314950\``,
        )
        await queryRunner.query(`ALTER TABLE \`match\` DROP COLUMN \`competitionSeasonId\``)
    }
}
