--create table [#tempinv_parts_count] (
--[Id] [int] identity,
--[part_id] [int] NULL,
--[current_count] [decimal] (18,0) NULL,
--[reserved_count] [decimal] (18,0) NULL,
--[supplier_id] [int] NULL,
--[unit_cost] [decimal] (18,0) NULL);



set identity_insert [#tempinv_parts_count] on;


insert [#tempinv_parts_count] ([Id],[part_id],[current_count],[reserved_count],[supplier_id],[unit_cost])
select 1,2,20,2,1,200;

set identity_insert [#tempinv_parts_count] off;