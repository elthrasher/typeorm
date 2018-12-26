import "reflect-metadata";
import {expect} from "chai";

import {closeTestingConnections, reloadTestingDatabases, createTestingConnections} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Repository} from "../../../src";

import {Bar} from "./entity/Bar";
import {DocumentEnum} from "./documentEnum";

describe("github issues > #2871 Empty enum array is returned as array with single empty string", () => {
  let connections: Connection[];
  let repository: Repository<Bar>;

  before(async () => connections = await createTestingConnections({
    entities: [__dirname + "/entity/*{.js,.ts}"],
    schemaCreate: true,
    dropSchema: true,
    enabledDrivers: [
      "postgres"
    ]
  }));
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should extract array with values from enum array values from 'postgres'", () => Promise.all(connections.map(async connection => {
    repository = connection.getRepository(Bar);

    const documents: DocumentEnum[] = [DocumentEnum.DOCUMENT_A, DocumentEnum.DOCUMENT_B, DocumentEnum.DOCUMENT_C];

    const barSaved = await repository.save({documents}) as Bar;
    const barFromDb = await repository.findOne(barSaved.barId) as Bar;

    expect(barFromDb.documents).to.eql(documents);
  })));

  it("should extract array with one value from enum array with one value from 'postgres'", () => Promise.all(connections.map(async connection => {
    repository = connection.getRepository(Bar);
    const documents: DocumentEnum[] = [DocumentEnum.DOCUMENT_D];

    const barSaved = await repository.save({documents}) as Bar;
    const barFromDb = await repository.findOne(barSaved.barId) as Bar;

    expect(barFromDb.documents).to.eql(documents);
  })));

  // This `it` test that issue #2871 is fixed
  it("should extract empty array from empty enum array from 'postgres'", () => Promise.all(connections.map(async connection => {
    repository = connection.getRepository(Bar);
    const documents: DocumentEnum[] = [];

    const barSaved = await repository.save({documents}) as Bar;
    const barFromDb = await repository.findOne(barSaved.barId) as Bar;

    expect(barFromDb.documents).to.eql(documents);
  })));
});
