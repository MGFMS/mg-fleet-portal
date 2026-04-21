--create table [#tempCustomers] (
--[Id] [int] identity,
--[customer_name] [nvarchar] (200) NULL,
--[customer_address] [nvarchar] (500) NULL,
--[customer_city] [nvarchar] (100) NULL,
--[contact_number] [nvarchar] (50) NULL,
--[email_address] [nvarchar] (50) NULL,
--[TIN] [int] NULL,
--[company_name] [nvarchar] (200) NULL,
--[added_by] [nvarchar] (50) NULL,
--[date_added] [datetime] NULL,
--[updated_by] [nvarchar] (50) NULL,
--[date_updated] [datetime] NULL,
--[is_active] [smallint] NULL,
--[customer_source] [nvarchar] (50) NULL);



set identity_insert [#tempCustomers] on;


insert [#tempCustomers] ([Id],[customer_name],[customer_address],[customer_city],[contact_number],[email_address],[TIN],[company_name],[added_by],[date_added],[updated_by],[date_updated],[is_active],[customer_source])
select 1,N'GIAN CRUZ',NULL,N'Metro Manila - Muntinlupa City',N'09182229800',NULL,NULL,NULL,N'jggozum (MG Bacoor)','2025-10-01 13:15:19.820',NULL,NULL,1,N'TEXT' UNION ALL
select 2,N'JUN KING MANZANO',NULL,NULL,N'09112372231',NULL,NULL,NULL,N'jggozum (MG Bacoor)','2025-10-01 14:07:51.760',NULL,NULL,1,N'WALK-IN' UNION ALL
select 3,N'NOAH REYES',NULL,NULL,N'09187212314',NULL,NULL,N'PUREFOODS',N'jggozum (MG Bacoor)','2025-10-01 14:12:23.800',NULL,NULL,1,N'FACEBOOK' UNION ALL
select 4,N'JUNICA ANN DOMINGO',NULL,NULL,N'09227110909',NULL,NULL,NULL,N'jggozum (MG Bacoor)','2025-10-01 14:15:08.620',NULL,NULL,1,N'FACEBOOK' UNION ALL
select 5,N'MARK VILLEGAS',NULL,NULL,N'09129992002',NULL,NULL,NULL,N'jggozum (MG Bacoor)','2025-10-01 14:16:57.333',NULL,NULL,1,N'FACEBOOK' UNION ALL
select 6,N'RAMON VILLEGAS',NULL,NULL,N'09182234112',NULL,NULL,NULL,N'jggozum (MG Bacoor)','2025-10-01 18:40:11.860',NULL,NULL,1,N'FACEBOOK' UNION ALL
select 7,N'BENJAMIN TORRES',N'Blk 221, Street 12',N'Makati',N'09668874648',N'customer8984@purefoods.com',593317248,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 8,N'SEBASTIAN BAUTISTA',N'Blk 90, Street 2',N'Cebu City',N'09167310735',N'customer6086@purefoods.com',647741220,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 9,N'LOGAN NAVARRO',N'Blk 28, Street 55',N'Pasig',N'09105793609',N'customer4314@purefoods.com',158110831,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 10,N'ALEXANDER FLORES',N'Blk 66, Street 51',N'Makati',N'09144470253',N'customer7223@purefoods.com',171296445,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 11,N'DANIEL GARCIA',N'Blk 28, Street 28',N'Davao City',N'09731216475',N'customer2713@purefoods.com',262177259,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 12,N'MATTHEW CASTILLO',N'Blk 178, Street 51',N'Davao City',N'0942295773',N'customer7122@purefoods.com',457199816,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 13,N'DAVID MORALES',N'Blk 257, Street 20',N'Davao City',N'09504491853',N'customer2303@purefoods.com',784673115,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 14,N'JOSEPH AQUINO',N'Blk 133, Street 38',N'Davao City',N'09277761891',N'customer5729@purefoods.com',187253937,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 15,N'SAMUEL RIVERA',N'Blk 117, Street 7',N'Makati',N'09714060913',N'customer569@purefoods.com',451382122,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 16,N'LEVI DELGADO',N'Blk 148, Street 99',N'Pasig',N'09413315265',N'customer3988@purefoods.com',698910940,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 17,N'MATEO GUZMAN',N'Blk 56, Street 3',N'Makati',N'09936147220',N'customer2711@purefoods.com',817172150,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 18,N'MICHAEL DOMINGUEZ',N'Blk 290, Street 34',N'Pasig',N'09330281004',N'customer8780@purefoods.com',608272389,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 19,N'ELIJAH VARGAS',N'Blk 161, Street 68',N'Davao City',N'09782042850',N'customer9985@purefoods.com',895078025,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 20,N'GABRIEL PASCUAL',N'Blk 9, Street 7',N'Cebu City',N'09281837607',N'customer6992@purefoods.com',792850074,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 21,N'SOPHIA SANTOS',N'Blk 63, Street 93',N'Pasig',N'09838656616',N'customer173@purefoods.com',348710307,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 22,N'ISABELLA CRUZ',N'Blk 140, Street 57',N'Quezon City',N'09957270234',N'customer3256@purefoods.com',828117842,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 23,N'MIA REYES',N'Blk 195, Street 26',N'Davao City',N'09238492708',N'customer7719@purefoods.com',842684571,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 24,N'AMELIA RAMOS',N'Blk 107, Street 25',N'Davao City',N'09411478315',N'customer9934@purefoods.com',411686772,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 25,N'HARPER DELA CRUZ',N'Blk 157, Street 84',N'Quezon City',N'0912036432',N'customer4120@purefoods.com',325892511,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 26,N'EVELYN MENDOZA',N'Blk 181, Street 27',N'Davao City',N'09110674271',N'customer9907@purefoods.com',867497127,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 27,N'ABIGAIL TORRES',N'Blk 115, Street 84',N'Makati',N'09562917333',N'customer4059@purefoods.com',484673810,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 28,N'ELLA BAUTISTA',N'Blk 48, Street 12',N'Cebu City',N'0958521062',N'customer5679@purefoods.com',251991506,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 29,N'SCARLETT NAVARRO',N'Blk 182, Street 31',N'Davao City',N'09479121047',N'customer8188@purefoods.com',103328051,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 30,N'GRACE FLORES',N'Blk 37, Street 55',N'Davao City',N'09419914549',N'customer5079@purefoods.com',948500578,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 31,N'CHLOE GARCIA',N'Blk 170, Street 48',N'Davao City',N'0999904700',N'customer1103@purefoods.com',444641596,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 32,N'VICTORIA CASTILLO',N'Blk 144, Street 27',N'Makati',N'09565762965',N'customer140@purefoods.com',371158612,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 33,N'ARIA MORALES',N'Blk 53, Street 21',N'Quezon City',N'09882048528',N'customer8998@purefoods.com',137139653,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 34,N'CAMILA AQUINO',N'Blk 172, Street 49',N'Davao City',N'09286749783',N'customer1581@purefoods.com',599542863,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 35,N'PENELOPE RIVERA',N'Blk 261, Street 63',N'Pasig',N'09731674863',N'customer6126@purefoods.com',376585503,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 36,N'LAYLA DELGADO',N'Blk 45, Street 2',N'Makati',N'09919297480',N'customer2021@purefoods.com',122998329,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 37,N'RILEY GUZMAN',N'Blk 279, Street 51',N'Pasig',N'09372996658',N'customer9440@purefoods.com',774046369,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 38,N'ZOEY DOMINGUEZ',N'Blk 43, Street 72',N'Makati',N'09499170007',N'customer2061@purefoods.com',936064719,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 39,N'NORA VARGAS',N'Blk 18, Street 52',N'Davao City',N'09361946736',N'customer98@purefoods.com',222839044,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 40,N'HAZEL PASCUAL',N'Blk 293, Street 2',N'Cebu City',N'09262592522',N'customer4756@purefoods.com',644143518,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 41,N'AVERY SANTOS',N'Blk 244, Street 92',N'Pasig',N'09795731150',N'customer2867@purefoods.com',206305115,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 42,N'LUNA CRUZ',N'Blk 201, Street 12',N'Davao City',N'09867499302',N'customer9465@purefoods.com',682101564,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 43,N'AURORA REYES',N'Blk 245, Street 80',N'Davao City',N'09407495381',N'customer9153@purefoods.com',301982235,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 44,N'SAVANNAH RAMOS',N'Blk 205, Street 54',N'Makati',N'09506486122',N'customer3606@purefoods.com',434138668,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 45,N'STELLA DELA CRUZ',N'Blk 150, Street 45',N'Pasig',N'0995599082',N'customer2387@purefoods.com',990392892,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 46,N'MADISON MENDOZA',N'Blk 96, Street 24',N'Pasig',N'09904304107',N'customer895@purefoods.com',518134412,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 47,N'ELLIE TORRES',N'Blk 258, Street 84',N'Davao City',N'0994303783',N'customer9247@purefoods.com',628137755,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 48,N'VIOLET BAUTISTA',N'Blk 247, Street 43',N'Pasig',N'0936550859',N'customer4888@purefoods.com',208546353,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 49,N'CLAIRE NAVARRO',N'Blk 107, Street 83',N'Makati',N'09623070647',N'customer1371@purefoods.com',424851685,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 50,N'PAISLEY FLORES',N'Blk 278, Street 66',N'Quezon City',N'09549675159',N'customer3933@purefoods.com',862424284,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 51,N'LEO GARCIA',N'Blk 235, Street 84',N'Davao City',N'09683260265',N'customer8962@purefoods.com',730213887,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 52,N'JULIAN CASTILLO',N'Blk 78, Street 83',N'Pasig',N'09726278808',N'customer6272@purefoods.com',243522812,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 53,N'ADRIAN MORALES',N'Blk 180, Street 70',N'Davao City',N'0965919631',N'customer7066@purefoods.com',666025001,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 54,N'NATHAN AQUINO',N'Blk 297, Street 68',N'Cebu City',N'09232684920',N'customer5103@purefoods.com',392949207,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 55,N'ISAAC RIVERA',N'Blk 139, Street 57',N'Pasig',N'09548519942',N'customer3090@purefoods.com',258975696,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 56,N'OWEN DELGADO',N'Blk 165, Street 8',N'Davao City',N'09344943458',N'customer4995@purefoods.com',547835301,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 57,N'CALEB GUZMAN',N'Blk 3, Street 83',N'Davao City',N'09355018100',N'customer1730@purefoods.com',763907112,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 58,N'HENRY DOMINGUEZ',N'Blk 68, Street 28',N'Cebu City',N'09504949935',N'customer9074@purefoods.com',142069782,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 59,N'ELI VARGAS',N'Blk 189, Street 43',N'Davao City',N'09177371643',N'customer6988@purefoods.com',777770186,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 60,N'JOSHUA PASCUAL',N'Blk 129, Street 2',N'Davao City',N'09297703871',N'customer1418@purefoods.com',391471667,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 61,N'SOFIA SANTOS',N'Blk 101, Street 47',N'Davao City',N'09699814964',N'customer507@purefoods.com',144937825,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 62,N'OLIVIA CRUZ',N'Blk 54, Street 51',N'Davao City',N'09286272557',N'customer2870@purefoods.com',633209434,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 63,N'HANNAH REYES',N'Blk 49, Street 26',N'Davao City',N'09515458524',N'customer9338@purefoods.com',361755375,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 64,N'LEAH RAMOS',N'Blk 13, Street 37',N'Davao City',N'09136059765',N'customer932@purefoods.com',561309891,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 65,N'EMILY DELA CRUZ',N'Blk 127, Street 18',N'Cebu City',N'09159605608',N'customer2826@purefoods.com',614471901,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 66,N'ARIANA MENDOZA',N'Blk 125, Street 1',N'Makati',N'0955246727',N'customer7778@purefoods.com',952474521,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 67,N'BELLA TORRES',N'Blk 33, Street 74',N'Davao City',N'09192843512',N'customer8631@purefoods.com',497661443,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 68,N'NAOMI BAUTISTA',N'Blk 269, Street 38',N'Pasig',N'09488063514',N'customer7363@purefoods.com',469386686,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 69,N'ALEXA NAVARRO',N'Blk 74, Street 32',N'Davao City',N'09815194485',N'customer6229@purefoods.com',774806732,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 70,N'GABRIELLA FLORES',N'Blk 118, Street 69',N'Davao City',N'09852341971',N'customer2696@purefoods.com',556971635,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 71,N'CAROLINE GARCIA',N'Blk 262, Street 96',N'Pasig',N'09671427235',N'customer1612@purefoods.com',413132605,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 72,N'SKYLAR CASTILLO',N'Blk 73, Street 13',N'Makati',N'09310377131',N'customer2715@purefoods.com',335665297,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 73,N'ELENA MORALES',N'Blk 95, Street 69',N'Davao City',N'0972524738',N'customer3388@purefoods.com',294863031,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 74,N'LILA AQUINO',N'Blk 45, Street 60',N'Davao City',N'09999246771',N'customer8802@purefoods.com',986472307,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 75,N'MAYA RIVERA',N'Blk 292, Street 73',N'Davao City',N'09809971364',N'customer9925@purefoods.com',417174197,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 76,N'ZOE DELGADO',N'Blk 218, Street 95',N'Davao City',N'09457351748',N'customer3915@purefoods.com',912381301,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 77,N'SERENITY GUZMAN',N'Blk 266, Street 27',N'Davao City',N'09254603075',N'customer7277@purefoods.com',219618527,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 78,N'RUBY DOMINGUEZ',N'Blk 119, Street 81',N'Davao City',N'09344641086',N'customer2886@purefoods.com',470372796,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 79,N'ALICE VARGAS',N'Blk 42, Street 48',N'Davao City',N'09369495158',N'customer8066@purefoods.com',396693309,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 80,N'EVA PASCUAL',N'Blk 44, Street 82',N'Davao City',N'09676137811',N'customer8571@purefoods.com',241100169,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 81,N'DYLAN SANTOS',N'Blk 253, Street 71',N'Davao City',N'09992860175',N'customer3751@purefoods.com',789899001,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 82,N'JAXON CRUZ',N'Blk 45, Street 55',N'Makati',N'09101799690',N'customer9703@purefoods.com',475915475,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 83,N'CARTER REYES',N'Blk 47, Street 83',N'Davao City',N'0984610906',N'customer6756@purefoods.com',638949860,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 84,N'WYATT RAMOS',N'Blk 209, Street 2',N'Davao City',N'09512647426',N'customer1313@purefoods.com',803218853,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 85,N'LUKE DELA CRUZ',N'Blk 193, Street 26',N'Davao City',N'09602021714',N'customer3118@purefoods.com',765455876,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 86,N'GRAYSON MENDOZA',N'Blk 87, Street 66',N'Davao City',N'09640111293',N'customer7518@purefoods.com',387542928,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 87,N'HUDSON TORRES',N'Blk 152, Street 52',N'Davao City',N'0915498290',N'customer6178@purefoods.com',383523422,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 88,N'JACK BAUTISTA',N'Blk 296, Street 97',N'Quezon City',N'09480300333',N'customer8746@purefoods.com',871464002,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 89,N'RYAN NAVARRO',N'Blk 147, Street 56',N'Makati',N'09593290068',N'customer9355@purefoods.com',498012505,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 90,N'ANTHONY FLORES',N'Blk 89, Street 5',N'Davao City',N'09398668474',N'customer9166@purefoods.com',159124560,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 91,N'CHRISTIAN GARCIA',N'Blk 78, Street 24',N'Davao City',N'09535490766',N'customer5348@purefoods.com',133225792,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 92,N'JOSIAH CASTILLO',N'Blk 113, Street 18',N'Quezon City',N'09543898458',N'customer3292@purefoods.com',241784442,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 93,N'DOMINIC MORALES',N'Blk 263, Street 24',N'Makati',N'09226904808',N'customer5412@purefoods.com',252201941,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 94,N'AARON AQUINO',N'Blk 33, Street 89',N'Davao City',N'094090335',N'customer9240@purefoods.com',642057388,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 95,N'EZRA RIVERA',N'Blk 269, Street 61',N'Davao City',N'09145484085',N'customer412@purefoods.com',234052549,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 96,N'Customer 90',N'Blk 106, Street 46',N'Davao City',N'0978012809',N'customer5586@purefoods.com',399029078,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 97,N'Customer 91',N'Blk 295, Street 29',N'Quezon City',N'09888941835',N'customer3297@purefoods.com',292980533,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 98,N'Customer 92',N'Blk 143, Street 43',N'Quezon City',N'09131334266',N'customer1511@purefoods.com',584036914,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 99,N'Customer 93',N'Blk 60, Street 10',N'Cebu City',N'09305992546',N'customer2388@purefoods.com',445334766,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 100,N'Customer 94',N'Blk 112, Street 44',N'Davao City',N'0957673864',N'customer1182@purefoods.com',162709191,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 101,N'Customer 95',N'Blk 227, Street 94',N'Davao City',N'09759595987',N'customer8069@purefoods.com',229783548,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 102,N'Customer 96',N'Blk 295, Street 11',N'Quezon City',N'09549907114',N'customer9095@purefoods.com',161412801,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 103,N'Customer 97',N'Blk 12, Street 91',N'Makati',N'0928175397',N'customer7221@purefoods.com',908683336,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 104,N'Customer 98',N'Blk 222, Street 74',N'Quezon City',N'09477170397',N'customer5950@purefoods.com',354196775,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 105,N'Customer 99',N'Blk 249, Street 34',N'Davao City',N'09913523285',N'customer620@purefoods.com',261222507,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate' UNION ALL
select 106,N'Customer 100',N'Blk 96, Street 66',N'Davao City',N'09649109931',N'customer8934@purefoods.com',301659140,N'PUREFOODS',N'system','2025-10-01 15:04:23.767',N'system','2025-10-01 15:04:23.767',1,N'Corporate';

set identity_insert [#tempCustomers] off;