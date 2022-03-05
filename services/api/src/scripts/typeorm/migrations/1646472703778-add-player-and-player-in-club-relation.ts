import { MigrationInterface, QueryRunner } from 'typeorm'

export class addPlayerAndPlayerInClubRelation1646472703778 implements MigrationInterface {
    name = 'addPlayerAndPlayerInClubRelation1646472703778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`player\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`surname\` varchar(255) NOT NULL, \`dateOfBirth\` date NOT NULL, \`facrMemberFrom\` date NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `CREATE TABLE \`player_in_club\` (\`id\` varchar(36) NOT NULL, \`playingFrom\` date NOT NULL, \`isOnLoan\` tinyint NOT NULL DEFAULT 0, \`playerId\` int NOT NULL, \`clubId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` ADD CONSTRAINT \`FK_544faad75cee88a3fbc86828cb7\` FOREIGN KEY (\`playerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` ADD CONSTRAINT \`FK_18cafc3b8999560c75e9f3d1492\` FOREIGN KEY (\`clubId\`) REFERENCES \`club\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` DROP FOREIGN KEY \`FK_18cafc3b8999560c75e9f3d1492\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_in_club\` DROP FOREIGN KEY \`FK_544faad75cee88a3fbc86828cb7\``,
        )
        await queryRunner.query(`DROP TABLE \`player_in_club\``)
        await queryRunner.query(`DROP TABLE \`player\``)
    }
}
