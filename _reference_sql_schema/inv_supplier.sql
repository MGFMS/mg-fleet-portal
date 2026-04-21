--create table [#tempinv_supplier] (
--[Id] [int] identity,
--[supplier_name] [nvarchar] (200) NULL,
--[contact_person] [nvarchar] (200) NULL,
--[contact_number] [nvarchar] (200) NULL,
--[notes] [nvarchar] (max) NULL,
--[added_by] [nvarchar] (50) NULL,
--[date_added] [datetime] NULL,
--[updated_by] [nvarchar] (50) NULL,
--[date_updated] [datetime] NULL);



set identity_insert [#tempinv_supplier] on;


insert [#tempinv_supplier] ([Id],[supplier_name],[contact_person],[contact_number],[notes],[added_by],[date_added],[updated_by],[date_updated])
select 1,N'Autoplus Trading',N'Mark Santos',N'0917-123-4567',N'Specializes in brake and suspension parts',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 2,N'Mototek Parts Supply',N'Anna Cruz',N'0998-234-5678',N'Authorized Motolite battery distributor',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 3,N'SpeedParts PH',N'James Dela Cruz',N'0927-345-6789',N'High-performance aftermarket car parts',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 4,N'Manila Auto Components',N'Carla Reyes',N'0918-456-7890',N'OEM and replacement car filters supplier',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 5,N'GearUp Enterprises',N'Leo Ramirez',N'0906-567-8901',N'Transmission and clutch parts',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 6,N'Evercool Radiators',N'Francis Lim',N'0999-678-9012',N'Cooling system specialist',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 7,N'NGK Spark Center',N'Diane Chua',N'0917-789-0123',N'Official NGK spark plugs distributor',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 8,N'Brembo PH',N'Paolo Hernandez',N'0928-890-1234',N'High-end brake systems supplier',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 9,N'KYB Suspension Supply',N'Michelle Tan',N'0908-901-2345',N'OEM shock absorbers and struts',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327' UNION ALL
select 10,N'Walbro Fuel Systems',N'Rico Gutierrez',N'0915-012-3456',N'Specialist in fuel pumps and injectors',N'system','2025-10-01 05:44:12.327',N'system','2025-10-01 05:44:12.327';

set identity_insert [#tempinv_supplier] off;