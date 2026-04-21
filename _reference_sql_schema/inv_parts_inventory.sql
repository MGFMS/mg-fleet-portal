--create table [#tempinv_parts_inventory] (
--[Id] [int] identity,
--[part_id] [int] NULL,
--[supplier_id] [int] NULL,
--[unit_price] [decimal] (18,0) NULL,
--[inventory_type] [varchar] (20) NULL,
--[qty] [decimal] (18,0) NULL,
--[purchase_order] [int] NULL,
--[quotation_id] [int] NULL,
--[qoutation_code] [nvarchar] (20) NULL);



set identity_insert [#tempinv_parts_inventory] on;


insert [#tempinv_parts_inventory] ([Id],[part_id],[supplier_id],[unit_price],[inventory_type],[qty],[purchase_order],[quotation_id],[qoutation_code])
select 1,2,1,NULL,'RESERVED',2,NULL,1,N'Q-MGB-1';

set identity_insert [#tempinv_parts_inventory] off;