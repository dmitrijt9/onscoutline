import { MigrationInterface, QueryRunner } from 'typeorm'

export class initDb1650462161746 implements MigrationInterface {
    name = 'initDb1650462161746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`club\` (\`id\` int NOT NULL AUTO_INCREMENT, \`facrId\` varchar(255) NULL, \`name\` varchar(255) NOT NULL, \`facrUuid\` varchar(255) NULL, UNIQUE INDEX \`IDX_1c108c1e1bd440e1e2a474f72e\` (\`facrId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`competition\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`regionId\` varchar(255) NOT NULL, \`regionName\` varchar(255) NOT NULL, \`facrId\` varchar(255) NOT NULL, \`facrUuid\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_4235f333ca8098d3693049ab82\` (\`name\`), UNIQUE INDEX \`Competition_UQ_IDX\` (\`regionId\`, \`facrId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`season\` (\`name\` varchar(255) NOT NULL, \`year1\` varchar(255) NOT NULL, \`year2\` varchar(255) NOT NULL, PRIMARY KEY (\`name\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`competition_has_season\` (\`id\` varchar(36) NOT NULL, \`competitionId\` int NULL, \`seasonName\` varchar(255) NULL, UNIQUE INDEX \`CompetitionHasSeason_UQ_IDX\` (\`competitionId\`, \`seasonName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`match\` (\`id\` int NOT NULL AUTO_INCREMENT, \`when\` datetime NOT NULL, \`where\` varchar(255) NULL, \`scoreHome\` int NOT NULL, \`scoreAway\` int NOT NULL, \`homeTeamId\` int NULL, \`awayTeamId\` int NULL, \`competitionSeasonId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`player\` (\`id\` int NOT NULL AUTO_INCREMENT, \`facrId\` varchar(255) NULL, \`name\` varchar(255) NOT NULL, \`surname\` varchar(255) NOT NULL, \`gender\` varchar(255) NULL, \`country\` varchar(255) NULL, \`dateOfBirth\` varchar(255) NULL, \`facrMemberFrom\` date NULL, \`position\` longtext NULL, \`transferRecords\` longtext NULL, UNIQUE INDEX \`IDX_696b4ab31f39377e3d62274f25\` (\`facrId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`player_in_match\` (\`id\` varchar(36) NOT NULL, \`playedFromMinute\` int NULL, \`playerId\` int NOT NULL, \`matchId\` int NOT NULL, UNIQUE INDEX \`PlayerPlaysMatch_UQ_IDX\` (\`playerId\`, \`matchId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`player_game_statistic\` (\`id\` varchar(36) NOT NULL, \`statType\` varchar(255) NOT NULL, \`value\` int NOT NULL, \`minute\` int NULL, \`playerInMatchId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`player_in_club\` (\`id\` varchar(36) NOT NULL, \`playingFrom\` date NOT NULL, \`playingUntil\` date NULL, \`isOnLoan\` tinyint NOT NULL DEFAULT 0, \`playerId\` int NOT NULL, \`clubId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` ADD CONSTRAINT \`FK_86fb3a0dcc2f95672d435441624\` FOREIGN KEY (\`competitionId\`) REFERENCES \`competition\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` ADD CONSTRAINT \`FK_facd5fffec33657773295dde3cc\` FOREIGN KEY (\`seasonName\`) REFERENCES \`season\`(\`name\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` ADD CONSTRAINT \`FK_5caac1768e2f5b7b9c69b62090c\` FOREIGN KEY (\`homeTeamId\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` ADD CONSTRAINT \`FK_07f5b02809e195be415834ed78a\` FOREIGN KEY (\`awayTeamId\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` ADD CONSTRAINT \`FK_07a3958f4ebc76ea6021d314950\` FOREIGN KEY (\`competitionSeasonId\`) REFERENCES \`competition_has_season\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` ADD CONSTRAINT \`FK_ac205cea1301b19f3ac849c8bd2\` FOREIGN KEY (\`playerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` ADD CONSTRAINT \`FK_4244f2c5476038206b53e86911c\` FOREIGN KEY (\`matchId\`) REFERENCES \`match\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_game_statistic\` ADD CONSTRAINT \`FK_34331a37b54787cea26acbb9523\` FOREIGN KEY (\`playerInMatchId\`) REFERENCES \`player_in_match\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` ADD CONSTRAINT \`FK_544faad75cee88a3fbc86828cb7\` FOREIGN KEY (\`playerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` ADD CONSTRAINT \`FK_18cafc3b8999560c75e9f3d1492\` FOREIGN KEY (\`clubId\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `CREATE TABLE \`query-result-cache\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(255) NULL, \`time\` bigint NOT NULL, \`duration\` int NOT NULL, \`query\` text NOT NULL, \`result\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`query-result-cache\``)
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` DROP FOREIGN KEY \`FK_18cafc3b8999560c75e9f3d1492\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` DROP FOREIGN KEY \`FK_544faad75cee88a3fbc86828cb7\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_game_statistic\` DROP FOREIGN KEY \`FK_34331a37b54787cea26acbb9523\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` DROP FOREIGN KEY \`FK_4244f2c5476038206b53e86911c\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` DROP FOREIGN KEY \`FK_ac205cea1301b19f3ac849c8bd2\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_07a3958f4ebc76ea6021d314950\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_07f5b02809e195be415834ed78a\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_5caac1768e2f5b7b9c69b62090c\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` DROP FOREIGN KEY \`FK_facd5fffec33657773295dde3cc\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition_has_season\` DROP FOREIGN KEY \`FK_86fb3a0dcc2f95672d435441624\``,
        )
        await queryRunner.query(`DROP TABLE \`player_in_club\``)
        await queryRunner.query(`DROP TABLE \`player_game_statistic\``)
        await queryRunner.query(`DROP INDEX \`PlayerPlaysMatch_UQ_IDX\` ON \`player_in_match\``)
        await queryRunner.query(`DROP TABLE \`player_in_match\``)
        await queryRunner.query(`DROP INDEX \`IDX_696b4ab31f39377e3d62274f25\` ON \`player\``)
        await queryRunner.query(`DROP TABLE \`player\``)
        await queryRunner.query(`DROP TABLE \`match\``)
        await queryRunner.query(
            `DROP INDEX \`CompetitionHasSeason_UQ_IDX\` ON \`competition_has_season\``,
        )
        await queryRunner.query(`DROP TABLE \`competition_has_season\``)
        await queryRunner.query(`DROP TABLE \`season\``)
        await queryRunner.query(`DROP INDEX \`Competition_UQ_IDX\` ON \`competition\``)
        await queryRunner.query(`DROP INDEX \`IDX_4235f333ca8098d3693049ab82\` ON \`competition\``)
        await queryRunner.query(`DROP TABLE \`competition\``)
        await queryRunner.query(`DROP INDEX \`IDX_1c108c1e1bd440e1e2a474f72e\` ON \`club\``)
        await queryRunner.query(`DROP TABLE \`club\``)
    }
}
