--create table [#tempref_vehicle_brands] (
--[Id] [smallint] identity,
--[brand_name] [nvarchar] (100) NULL);



set identity_insert [#tempref_vehicle_brands] on;


insert [#tempref_vehicle_brands] ([Id],[brand_name])
select 1,N'Toyota' UNION ALL
select 2,N'Mitsubishi' UNION ALL
select 3,N'Honda' UNION ALL
select 4,N'Nissan' UNION ALL
select 5,N'Ford' UNION ALL
select 6,N'Hyundai' UNION ALL
select 7,N'Kia' UNION ALL
select 8,N'Suzuki' UNION ALL
select 9,N'Mazda' UNION ALL
select 10,N'Isuzu' UNION ALL
select 11,N'Chevrolet' UNION ALL
select 12,N'BMW' UNION ALL
select 13,N'Mercedes-Benz' UNION ALL
select 14,N'Audi' UNION ALL
select 15,N'Volkswagen' UNION ALL
select 16,N'Chery' UNION ALL
select 17,N'BYD' UNION ALL
select 18,N'MG' UNION ALL
select 19,N'GAC' UNION ALL
select 20,N'Volvo';

set identity_insert [#tempref_vehicle_brands] off;