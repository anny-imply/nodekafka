export const getJSON = (dataSource) => {
  return {
    query: `WITH s AS (SELECT\n"segment_id",\n"datasource",\n"start",\n"end",\n"version",\n"shard_spec",\n"partition_num",\n"size",\n"num_rows",\nCASE WHEN "num_rows" <> 0 THEN ("size" / "num_rows") ELSE 0 END AS "avg_row_size",\n"num_replicas",\n"replication_factor",\n"is_available",\n"is_active",\n"is_realtime"\nFROM sys.segments)\nSELECT *\nFROM s\nWHERE "datasource" = \'${dataSource}\'\nORDER BY "start" DESC, "version" DESC\nLIMIT 50`,
  };
};
