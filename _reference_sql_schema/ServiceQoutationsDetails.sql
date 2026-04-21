--create table [#tempServiceQoutationsDetails] (
--[Id] [int] identity,
--[qoutation_id] [int] NULL,
--[type] [nvarchar] (50) NULL,
--[qty] [decimal] (18,0) NULL,
--[service_id] [smallint] NULL,
--[part_id] [int] NULL,
--[part_name] [nvarchar] (100) NULL,
--[unit_labor_cost] [decimal] (18,0) NULL,
--[unit_part_cost] [decimal] (18,0) NULL,
--[parts_missing] [smallint] NULL,
--[sub_total] [decimal] (18,0) NULL,
--[supplier_id] [int] NULL);



set identity_insert [#tempServiceQoutationsDetails] on;


insert [#tempServiceQoutationsDetails] ([Id],[qoutation_id],[type],[qty],[service_id],[part_id],[part_name],[unit_labor_cost],[unit_part_cost],[parts_missing],[sub_total],[supplier_id])
select 1,1,N'Labor',1,1,0,N'',2500,0,0,2500,0 UNION ALL
select 2,1,N'Parts',2,0,2,N'',0,400,0,800,1;

set identity_insert [#tempServiceQoutationsDetails] off;