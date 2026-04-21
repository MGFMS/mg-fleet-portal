--create table [#tempServiceQoutationsHeader] (
--[Id] [int] identity,
--[qoutation_code] [nvarchar] (50) NULL,
--[customer_id] [int] NULL,
--[appointment_id] [int] NULL,
--[vehicle_id] [int] NULL,
--[plate_number] [nvarchar] (20) NULL,
--[customer_type] [nvarchar] (20) NULL,
--[schedule_type] [nvarchar] (20) NULL,
--[qoutation_notes] [nvarchar] (max) NULL,
--[assigned_mechanic_id] [smallint] NULL,
--[person_inchage] [smallint] NULL,
--[total_labor] [decimal] (18,0) NULL,
--[total_materials] [decimal] (18,0) NULL,
--[estimated_total] [decimal] (18,0) NULL,
--[discount] [decimal] (18,0) NULL,
--[vat_total] [decimal] (18,0) NULL,
--[grand_total] [decimal] (18,0) NULL,
--[status] [nvarchar] (50) NULL,
--[added_by] [nvarchar] (50) NULL,
--[date_added] [datetime] NULL,
--[updated_by] [nvarchar] (50) NULL,
--[date_updated] [datetime] NULL,
--[branch_id] [smallint] NULL,
--[latest_odometer] [int] NULL,
--[cancellation_reason] [nvarchar] (max) NULL);



set identity_insert [#tempServiceQoutationsHeader] on;


insert [#tempServiceQoutationsHeader] ([Id],[qoutation_code],[customer_id],[appointment_id],[vehicle_id],[plate_number],[customer_type],[schedule_type],[qoutation_notes],[assigned_mechanic_id],[person_inchage],[total_labor],[total_materials],[estimated_total],[discount],[vat_total],[grand_total],[status],[added_by],[date_added],[updated_by],[date_updated],[branch_id],[latest_odometer],[cancellation_reason])
select 1,N'Q-MGB-1',1,1,1,N'NEY667',N'',N'SCHEDULED',N'',0,0,2500,800,3300,0,0,0,N'OPEN',N'jggozum (MG Bacoor)','2025-10-01 14:06:14.133',NULL,NULL,1,19000,NULL;

set identity_insert [#tempServiceQoutationsHeader] off;