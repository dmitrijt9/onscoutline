import { MigrationInterface, QueryRunner } from 'typeorm'

export class addMatchAndRelation1647520568926 implements MigrationInterface {
    name = 'addMatchAndRelation1647520568926'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`match\` (\`id\` int NOT NULL AUTO_INCREMENT, \`when\` datetime NOT NULL, \`where\` varchar(255) NULL, \`scoreHome\` int NOT NULL, \`scoreAway\` int NOT NULL, \`homeTeamId\` int NULL, \`awayTeamId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`player_in_match\` (\`id\` varchar(36) NOT NULL, \`playedFromMinute\` int NULL, \`playerId\` int NOT NULL, \`matchId\` int NOT NULL, UNIQUE INDEX \`PlayerPlaysMatch_UQ_IDX\` (\`playerId\`, \`matchId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` ADD CONSTRAINT \`FK_5caac1768e2f5b7b9c69b62090c\` FOREIGN KEY (\`homeTeamId\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` ADD CONSTRAINT \`FK_07f5b02809e195be415834ed78a\` FOREIGN KEY (\`awayTeamId\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` ADD CONSTRAINT \`FK_ac205cea1301b19f3ac849c8bd2\` FOREIGN KEY (\`playerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` ADD CONSTRAINT \`FK_4244f2c5476038206b53e86911c\` FOREIGN KEY (\`matchId\`) REFERENCES \`match\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` DROP FOREIGN KEY \`FK_4244f2c5476038206b53e86911c\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_match\` DROP FOREIGN KEY \`FK_ac205cea1301b19f3ac849c8bd2\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_07f5b02809e195be415834ed78a\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_5caac1768e2f5b7b9c69b62090c\``,
        )
        await queryRunner.query(`DROP INDEX \`PlayerPlaysMatch_UQ_IDX\` ON \`player_in_match\``)
        await queryRunner.query(`DROP TABLE \`player_in_match\``)
        await queryRunner.query(`DROP TABLE \`match\``)
    }
}
