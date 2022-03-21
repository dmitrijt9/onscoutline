import { MigrationInterface, QueryRunner } from 'typeorm'

export class addPlayerGameStat1647781826502 implements MigrationInterface {
    name = 'addPlayerGameStat1647781826502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`player_game_statistic\` (\`id\` varchar(36) NOT NULL, \`statType\` varchar(255) NOT NULL, \`value\` int NOT NULL, \`minute\` int NULL, \`playerInMatchId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
        await queryRunner.query(
            `ALTER TABLE \`player_game_statistic\` ADD CONSTRAINT \`FK_34331a37b54787cea26acbb9523\` FOREIGN KEY (\`playerInMatchId\`) REFERENCES \`player_in_match\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player_game_statistic\` DROP FOREIGN KEY \`FK_34331a37b54787cea26acbb9523\``,
        )
        await queryRunner.query(`DROP TABLE \`player_game_statistic\``)
    }
}
