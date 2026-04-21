--create table [#tempref_vehicle_models] (
--[Id] [smallint] identity,
--[brand_id] [smallint] NULL,
--[model_name] [nvarchar] (100) NULL);



set identity_insert [#tempref_vehicle_models] on;


insert [#tempref_vehicle_models] ([Id],[brand_id],[model_name])
select 1,1,N'Vios' UNION ALL
select 2,1,N'Wigo' UNION ALL
select 3,1,N'Innova' UNION ALL
select 4,1,N'Fortuner' UNION ALL
select 5,1,N'Hilux' UNION ALL
select 6,1,N'Altis' UNION ALL
select 7,2,N'Xpander' UNION ALL
select 8,2,N'Montero Sport' UNION ALL
select 9,2,N'Strada' UNION ALL
select 10,2,N'L300' UNION ALL
select 11,2,N'Outlander' UNION ALL
select 12,3,N'Civic' UNION ALL
select 13,3,N'City' UNION ALL
select 14,3,N'CR-V' UNION ALL
select 15,3,N'BR-V' UNION ALL
select 16,3,N'Jazz' UNION ALL
select 17,4,N'Almera' UNION ALL
select 18,4,N'Navara' UNION ALL
select 19,4,N'Terra' UNION ALL
select 20,4,N'Juke' UNION ALL
select 21,4,N'Kicks' UNION ALL
select 22,5,N'Ranger' UNION ALL
select 23,5,N'Everest' UNION ALL
select 24,5,N'EcoSport' UNION ALL
select 25,5,N'Explorer' UNION ALL
select 26,5,N'Mustang' UNION ALL
select 27,6,N'Accent' UNION ALL
select 28,6,N'Tucson' UNION ALL
select 29,6,N'Santa Fe' UNION ALL
select 30,6,N'Staria' UNION ALL
select 31,6,N'Kona' UNION ALL
select 32,7,N'Sportage' UNION ALL
select 33,7,N'Carnival' UNION ALL
select 34,7,N'Sorento' UNION ALL
select 35,7,N'Stonic' UNION ALL
select 36,7,N'Seltos' UNION ALL
select 37,8,N'Swift' UNION ALL
select 38,8,N'Ertiga' UNION ALL
select 39,8,N'S-Presso' UNION ALL
select 40,8,N'Vitara' UNION ALL
select 41,8,N'Celerio' UNION ALL
select 42,9,N'Mazda2' UNION ALL
select 43,9,N'Mazda3' UNION ALL
select 44,9,N'CX-5' UNION ALL
select 45,9,N'CX-30' UNION ALL
select 46,9,N'BT-50' UNION ALL
select 47,10,N'D-Max' UNION ALL
select 48,10,N'MU-X' UNION ALL
select 49,10,N'Crosswind' UNION ALL
select 50,11,N'Trailblazer' UNION ALL
select 51,11,N'Colorado' UNION ALL
select 52,11,N'Spark' UNION ALL
select 53,11,N'Malibu' UNION ALL
select 54,12,N'3 Series' UNION ALL
select 55,12,N'5 Series' UNION ALL
select 56,12,N'X1' UNION ALL
select 57,12,N'X5' UNION ALL
select 58,13,N'C-Class' UNION ALL
select 59,13,N'E-Class' UNION ALL
select 60,13,N'GLC' UNION ALL
select 61,13,N'GLE' UNION ALL
select 62,14,N'A3' UNION ALL
select 63,14,N'A4' UNION ALL
select 64,14,N'Q3' UNION ALL
select 65,15,N'Tiguan' UNION ALL
select 66,15,N'Polo' UNION ALL
select 67,15,N'Passat' UNION ALL
select 68,16,N'Tiggo 7' UNION ALL
select 69,16,N'Tiggo 8' UNION ALL
select 70,16,N'Omoda 5' UNION ALL
select 71,17,N'Atto 3' UNION ALL
select 72,17,N'Tang' UNION ALL
select 73,17,N'Yuan Plus' UNION ALL
select 74,18,N'ZS EV' UNION ALL
select 75,18,N'HS' UNION ALL
select 76,18,N'RX5' UNION ALL
select 77,19,N'GS4' UNION ALL
select 78,19,N'Aion Y' UNION ALL
select 79,19,N'Emkoo' UNION ALL
select 80,20,N'XC40' UNION ALL
select 81,20,N'XC60' UNION ALL
select 82,20,N'S90';

set identity_insert [#tempref_vehicle_models] off;