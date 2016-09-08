import {TableMetadata} from "./TableMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {RelationMetadata, PropertyTypeInFunction} from "./RelationMetadata";
import {IndexMetadata} from "./IndexMetadata";
import {RelationTypes} from "./types/RelationTypes";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {EntityMetadataArgs} from "../metadata-args/EntityMetadataArgs";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {LazyRelationsWrapper} from "../repository/LazyRelationsWrapper";

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * If entity's table is a closure-typed table, then this entity will have a closure junction table metadata.
     */
    closureJunctionTable: EntityMetadata;
    
    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize names.
     */
    readonly namingStrategy: NamingStrategyInterface;

    /**
     * Entity's table metadata.
     */
    readonly table: TableMetadata;

    /**
     * Entity's relation metadatas.
     */
    readonly relations: RelationMetadata[];

    /**
     * Entity's index metadatas.
     */
    readonly indices: IndexMetadata[];

    /**
     * Entity's foreign key metadatas.
     */
    readonly foreignKeys: ForeignKeyMetadata[] = [];

    /**
     * Entity's embedded metadatas.
     */
    readonly embeddeds: EmbeddedMetadata[];

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    /**
     * Entity's column metadatas.
     */
    private readonly _columns: ColumnMetadata[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private lazyRelationsWrapper: LazyRelationsWrapper, 
                args: EntityMetadataArgs) {
        this.namingStrategy = args.namingStrategy;
        this.table = args.tableMetadata;
        this._columns = args.columnMetadatas || [];
        this.relations = args.relationMetadatas || [];
        this.indices = args.indexMetadatas || [];
        this.foreignKeys = args.foreignKeyMetadatas || [];
        this.embeddeds = args.embeddedMetadatas || [];

        this.table.entityMetadata = this;
        this._columns.forEach(column => column.entityMetadata = this);
        this.relations.forEach(relation => relation.entityMetadata = this);
        this.foreignKeys.forEach(foreignKey => foreignKey.entityMetadata = this);
        this.indices.forEach(index => index.entityMetadata = this);
        this.embeddeds.forEach(embedded => embedded.entityMetadata = this);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Entity's name. Equal to entity target class's name if target is set to table, or equals to table name if its set.
     */
    get name(): string {
        if (!this.table)
            throw new Error("No table target set to the entity metadata.");
        
        return this.targetName ? this.targetName : this.table.name;
    }

    /**
     * All columns of the entity, including columns that are coming from the embeddeds of this entity.
     */
    get columns() {
        let allColumns: ColumnMetadata[] = ([] as ColumnMetadata[]).concat(this._columns);
        this.embeddeds.forEach(embedded => {
            allColumns = allColumns.concat(embedded.columns);
        });
        return allColumns;
    }
    
    /**
     * Target class to which this entity metadata is bind.
     */
    get target(): Function|string {
        return this.table.target;
    }

    /**
     * Gets the name of the target.
     */
    get targetName(): string {
        if (typeof this.target === "string")
            return this.target;

        if (this.target instanceof Function)
            return (<any> this.target).name;
        
        return "";
    }

    /**
     * Checks if entity's table has multiple primary columns.
     */
    get hasMultiplePrimaryKeys() {
        return this.primaryColumns.length > 1;
    }

    /**
     * Gets the primary column.
     *
     * @deprecated
     */
    get primaryColumn(): ColumnMetadata {
        const primaryKey = this._columns.find(column => column.isPrimary);
        if (!primaryKey)
            throw new Error(`Primary key is not set for the ${this.name} entity.`);

        return primaryKey;
    }

    /**
     * Checks if table has generated column.
     */
    get hasGeneratedColumn(): boolean {
        return !!this._columns.find(column => column.isGenerated);
    }

    /**
     * Gets the column with generated flag.
     */
    get generatedColumn(): ColumnMetadata {
        const generatedColumn = this._columns.find(column => column.isGenerated);
        if (!generatedColumn)
            throw new Error(`Generated column was not found`);

        return generatedColumn;
    }

    /**
     * Gets first primary column. In the case if table contains multiple primary columns it
     * throws error.
     */
    get firstPrimaryColumn(): ColumnMetadata {
        if (this.hasMultiplePrimaryKeys)
            throw new Error(`Entity ${this.name} has multiple primary keys. This operation is not supported on entities with multiple primary keys`);

        return this.primaryColumns[0];
    }

    /**
     * Gets the primary columns.
     */
    get primaryColumns(): ColumnMetadata[] {
        return this._columns.filter(column => column.isPrimary);
    }

    /**
     * Checks if entity has a create date column.
     */
    get hasCreateDateColumn(): boolean {
        return !!this._columns.find(column => column.mode === "createDate");
    }

    /**
     * Gets entity column which contains a create date value.
     */
    get createDateColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "createDate");
        if (!column)
            throw new Error(`CreateDateColumn was not found in entity ${this.name}`);
        
        return column;
    }

    /**
     * Checks if entity has an update date column.
     */
    get hasUpdateDateColumn(): boolean {
        return !!this._columns.find(column => column.mode === "updateDate");
    }

    /**
     * Gets entity column which contains an update date value.
     */
    get updateDateColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "updateDate");
        if (!column)
            throw new Error(`UpdateDateColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a version column.
     */
    get hasVersionColumn(): boolean {
        return !!this._columns.find(column => column.mode === "version");
    }

    /**
     * Gets entity column which contains an entity version.
     */
    get versionColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "version");
        if (!column)
            throw new Error(`VersionColumn was not found in entity ${this.name}`);
        
        return column;
    }

    /**
     * Checks if entity has a tree level column.
     */
    get hasTreeLevelColumn(): boolean {
        return !!this._columns.find(column => column.mode === "treeLevel");
    }

    get treeLevelColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "treeLevel");
        if (!column)
            throw new Error(`TreeLevelColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Gets single (values of which does not contain arrays) relations.
     */
    get singleValueRelations(): RelationMetadata[] {
        return this.relations.filter(relation => {
            return relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.ONE_TO_MANY;
        });
    }

    /**
     * Gets single (values of which does not contain arrays) relations.
     */
    get multiValueRelations(): RelationMetadata[] {
        return this.relations.filter(relation => {
            return relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.ONE_TO_MANY;
        });
    }

    /**
     * Gets only one-to-one relations of the entity.
     */
    get oneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE);
    }

    /**
     * Gets only owner one-to-one relations of the entity.
     */
    get ownerOneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE && relation.isOwning);
    }

    /**
     * Gets only one-to-many relations of the entity.
     */
    get oneToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_MANY);
    }

    /**
     * Gets only many-to-one relations of the entity.
     */
    get manyToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_ONE);
    }

    /**
     * Gets only many-to-many relations of the entity.
     */
    get manyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY);
    }

    /**
     * Gets only owner many-to-many relations of the entity.
     */
    get ownerManyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY && relation.isOwning);
    }

    /**
     * Gets only owner one-to-one and many-to-one relations.
     */
    get relationsWithJoinColumns() {
        return this.ownerOneToOneRelations.concat(this.manyToOneRelations);
    }

    /**
     * Checks if there is a tree parent relation. Used only in tree-tables.
     */
    get hasTreeParentRelation() {
        return !!this.relations.find(relation => relation.isTreeParent);
    }

    /**
     * Tree parent relation. Used only in tree-tables.
     */
    get treeParentRelation() {
        const relation = this.relations.find(relation => relation.isTreeParent);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);

        return relation;
    }

    /**
     * Checks if there is a tree children relation. Used only in tree-tables.
     */
    get hasTreeChildrenRelation() {
        return !!this.relations.find(relation => relation.isTreeChildren);
    }

    /**
     * Tree children relation. Used only in tree-tables.
     */
    get treeChildrenRelation() {
        const relation = this.relations.find(relation => relation.isTreeChildren);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);

        return relation;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new entity.
     */
    create(): any {

        // if target is set to a function (e.g. class) that can be created then create it
        if (this.table.target instanceof Function)
            return new (<any> this.table.target)();

        // otherwise simply return a new empty object
        const newObject = {};
        this.relations
            .filter(relation => relation.isLazy)
            .forEach(relation => this.lazyRelationsWrapper.wrap(newObject, relation));

        return newObject;
    }

    /**
     * Creates an object - map of columns and relations of the entity.
     */
    createPropertiesMap(): { [name: string]: string|any } {
        const entity: { [name: string]: string|any } = {};
        this._columns.forEach(column => entity[column.propertyName] = column.propertyName);
        this.relations.forEach(relation => entity[relation.propertyName] = relation.propertyName);
        return entity;
    }

    /**
     * Computes property name of the entity using given PropertyTypeInFunction.
     */
    computePropertyName(nameOrFn: PropertyTypeInFunction<any>) {
        return typeof nameOrFn === "string" ? nameOrFn : nameOrFn(this.createPropertiesMap());
    }

    getEntityIdMap(entity: any): ObjectLiteral|undefined {
        if (!entity)
            return undefined;

        const map: ObjectLiteral = {};
        this.primaryColumns.forEach(column => map[column.propertyName] = entity[column.propertyName]);
        const hasAllIds = this.primaryColumns.every(primaryColumn => {
            return map[primaryColumn.propertyName] !== undefined && map[primaryColumn.propertyName] !== null;
        });
        return hasAllIds ? map : undefined;
    }

    /**
     * Checks if column with the given property name exist.
     */
    hasColumnWithPropertyName(propertyName: string): boolean {
        return !!this._columns.find(column => column.propertyName === propertyName);
    }

    /**
     * Checks if column with the given database name exist.
     */
    hasColumnWithDbName(name: string): boolean {
        return !!this._columns.find(column => column.name === name);
    }

    /**
     * Checks if relation with the given property name exist.
     */
    hasRelationWithPropertyName(propertyName: string): boolean {
        return !!this.relations.find(relation => relation.propertyName === propertyName);
    }

    /**
     * Finds relation with the given property name.
     */
    findRelationWithPropertyName(propertyName: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.propertyName === propertyName);
        if (!relation)
            throw new Error(`Relation with property name ${propertyName} in ${this.name} entity was not found.`);
        
        return relation;
    }

    /**
     * Checks if relation with the given name exist.
     */
    hasRelationWithDbName(dbName: string): boolean {
        return !!this.relationsWithJoinColumns.find(relation => relation.name === dbName);
    }

    /**
     * Finds relation with the given name.
     */
    findRelationWithDbName(name: string): RelationMetadata {
        const relation = this.relationsWithJoinColumns.find(relation => relation.name === name);
        if (!relation)
            throw new Error(`Relation with name ${name} in ${this.name} entity was not found.`);

        return relation;
    }
    
    addColumn(column: ColumnMetadata) {
        this._columns.push(column);
        column.entityMetadata = this;
    }

    extractNonEmptyColumns(object: ObjectLiteral): ColumnMetadata[] {
        return this.columns.filter(column => !!object[column.propertyName]);
    }

    extractNonEmptySingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.MANY_TO_ONE)
                && !!object[relation.propertyName];
        });
    }

    extractNonEmptyMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.MANY_TO_MANY || relation.relationType === RelationTypes.ONE_TO_MANY)
                && !!object[relation.propertyName];
        });
    }

    extractExistSingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.MANY_TO_ONE)
                && object.hasOwnProperty(relation.propertyName);
        });
    }

    extractExistMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.MANY_TO_MANY || relation.relationType === RelationTypes.ONE_TO_MANY)
                && object.hasOwnProperty(relation.propertyName);
        });
    }

    checkIfObjectContainsAllPrimaryKeys(object: ObjectLiteral) {
        return this.primaryColumns.every(primaryColumn => {
            return object.hasOwnProperty(primaryColumn.propertyName);
        });
    }

    compareEntities(firstEntity: any, secondEntity: any) {
        const firstEntityIds = this.getEntityIdMap(firstEntity);
        const secondEntityIds = this.getEntityIdMap(secondEntity);
        return this.compareIds(firstEntityIds, secondEntityIds);
    }

    compareIds(firstIds: ObjectLiteral|undefined, secondIds: ObjectLiteral|undefined): boolean {
        if (!firstIds || !secondIds)
            return false;

        return Object.keys(firstIds).every(key => {
            return firstIds[key] === secondIds[key];
        });
    }

}