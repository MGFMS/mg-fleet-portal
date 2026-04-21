--create table [#tempref_concern_types] (
--[Id] [smallint] identity,
--[concern_type] [nvarchar] (200) NULL);



set identity_insert [#tempref_concern_types] on;


insert [#tempref_concern_types] ([Id],[concern_type])
select 1,N'LOW POWER' UNION ALL
select 2,N'WHITE SMOKE' UNION ALL
select 3,N'BLACK SMOKE' UNION ALL
select 4,N'HIGH FUEL CONSUMPTION' UNION ALL
select 5,N'CHECK ENGINE' UNION ALL
select 6,N'OVERHEAT' UNION ALL
select 7,N'UNUSUAL NOISES' UNION ALL
select 8,N'ROUGH IDLE' UNION ALL
select 9,N'ENGINE VIBRATION' UNION ALL
select 10,N'CLUTCH SLIDING' UNION ALL
select 11,N'OIL/FLUID LEAK' UNION ALL
select 12,N'HARD STARTING' UNION ALL
select 13,N'HARD STEERING' UNION ALL
select 14,N'ENGINE STALLING' UNION ALL
select 15,N'DELAY ACCELERATION/SHIFTING';

set identity_insert [#tempref_concern_types] off;