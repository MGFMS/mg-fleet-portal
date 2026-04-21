--create table [#tempinv_parts] (
--[Id] [int] identity,
--[part_name] [nvarchar] (100) NULL,
--[preferred_supplier_id] [int] NULL,
--[part_number_sku] [nvarchar] (50) NULL,
--[brand] [nvarchar] (50) NULL,
--[category_id] [smallint] NULL,
--[description] [nvarchar] (max) NULL,
--[compatible_models] [nvarchar] (max) NULL,
--[oum] [nvarchar] (50) NULL,
--[initial_cost_price] [decimal] (18,0) NULL,
--[selling_price] [decimal] (18,0) NULL,
--[added_by] [nvarchar] (50) NULL,
--[date_added] [datetime] NULL,
--[updated_by] [nvarchar] (50) NULL,
--[date_updated] [datetime] NULL,
--[part_type] [nvarchar] (50) NULL,
--[branch_id] [smallint] NULL,
--[part_code_no] [nvarchar] (50) NULL);



set identity_insert [#tempinv_parts] on;


insert [#tempinv_parts] ([Id],[part_name],[preferred_supplier_id],[part_number_sku],[brand],[category_id],[description],[compatible_models],[oum],[initial_cost_price],[selling_price],[added_by],[date_added],[updated_by],[date_updated],[part_type],[branch_id],[part_code_no])
select 1,N'Brake Pad Set - Front',1,N'BP-FRT-001',N'Brembo',1,N'High performance front brake pads',N'Toyota Vios, Honda City, Mitsubishi Mirage',N'pcs',1500,2200,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P001' UNION ALL
select 2,N'Oil Filter',1,N'OF-002',N'Bosch',1,N'Durable oil filter for longer engine life',N'Toyota Innova, Honda Civic, Nissan Almera',N'pcs',250,400,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P002' UNION ALL
select 3,N'Air Filter',1,N'AF-003',N'Denso',1,N'Engine air filter with high dust capacity',N'Mitsubishi Xpander, Toyota Wigo',N'pcs',350,550,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P003' UNION ALL
select 4,N'Spark Plug Set (4pcs)',1,N'SP-004',N'NGK',1,N'Iridium spark plug set for fuel efficiency',N'Toyota Corolla, Honda Jazz',N'pcs',900,1300,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P004' UNION ALL
select 5,N'Car Battery 2SM',1,N'BAT-005',N'Motolite',1,N'Maintenance-free car battery',N'Most compact sedans',N'pcs',3500,4800,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P005' UNION ALL
select 6,N'Clutch Disc',1,N'CD-006',N'Exedy',1,N'OEM replacement clutch disc',N'Toyota Vios, Nissan Sentra',N'pcs',2000,2800,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P006' UNION ALL
select 7,N'Shock Absorber - Rear',1,N'SA-R-007',N'KYB',1,N'Gas shock absorber for smooth ride',N'Toyota Fortuner, Mitsubishi Montero',N'pcs',3200,4500,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P007' UNION ALL
select 8,N'Radiator Assembly',1,N'RAD-008',N'Evercool',1,N'Complete radiator with fan shroud',N'Honda Civic, Toyota Altis',N'pcs',4800,6500,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P008' UNION ALL
select 9,N'Fuel Pump',1,N'FP-009',N'Walbro',1,N'High pressure fuel pump',N'Honda Civic FD, Toyota Corolla Altis',N'pcs',2200,3100,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P009' UNION ALL
select 10,N'Headlight Assembly - Left',1,N'HL-L-010',N'Stanley',1,N'OEM replacement headlight with housing',N'Toyota Innova, Mitsubishi Adventure',N'pcs',3500,5000,N'system','2025-10-01 05:39:44.057',N'system','2025-10-01 05:39:44.057',N'OEM',1,N'P010';

set identity_insert [#tempinv_parts] off;