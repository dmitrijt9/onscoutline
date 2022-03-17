import { MigrationInterface, QueryRunner } from 'typeorm'

export class addSeasonAndRelation1647526770063 implements MigrationInterface {
    name = 'addSeasonAndRelation1647526770063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`season\` (\`name\` varchar(255) NOT NULL, \`year\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, PRIMARY KEY (\`name\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`competition_has_season\` (\`id\` varchar(36) NOT NULL, \`competitionId\` int NULL, \`seasonName\` varchar(255) NULL, UNIQUE INDEX \`CompetitionHasSeason_UQ_IDX\` (\`competitionId\`, \`seasonName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` ADD CONSTRAINT \`FK_86fb3a0dcc2f95672d435441624\` FOREIGN KEY (\`competitionId\`) REFERENCES \`competition\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` ADD CONSTRAINT \`FK_facd5fffec33657773295dde3cc\` FOREIGN KEY (\`seasonName\`) REFERENCES \`season\`(\`name\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` DROP FOREIGN KEY \`FK_facd5fffec33657773295dde3cc\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` DROP FOREIGN KEY \`FK_86fb3a0dcc2f95672d435441624\``,
        )
        await queryRunner.query(
            `DROP INDEX \`CompetitionHasSeason_UQ_IDX\` ON \`competition_has_season\``,
        )
        await queryRunner.query(`DROP TABLE \`competition_has_season\``)
        await queryRunner.query(`DROP TABLE \`season\``)
    }
}
