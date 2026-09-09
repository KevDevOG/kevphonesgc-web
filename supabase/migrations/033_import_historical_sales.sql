-- Importación financiera histórica KevPhonesGC
-- Periodo de ventas: 01/07/2026 a 09/09/2026
-- Solo historical_sales: NO crea stock, clientes, ventas operativas ni movimientos de caja.
-- Las filas marcadas como fecha inferida/corregida usan fechas acordadas para completar datos faltantes.
-- Reejecutable sin duplicar esta importación.

BEGIN;

DELETE FROM public.historical_sales
WHERE note LIKE 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09%';

INSERT INTO public.historical_sales (
  product_name,
  purchase_date,
  purchase_price,
  sale_date,
  sale_price,
  note
)
VALUES
  ('ps5 slim disco', DATE '2026-07-05', 270.00, DATE '2026-07-07', 315.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('ps5 slim disco', DATE '2026-07-05', 290.00, DATE '2026-07-07', 315.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro max negro 256 82', DATE '2026-07-05', 400.00, DATE '2026-07-07', 430.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro max negro 256 87', DATE '2026-07-05', 580.00, DATE '2026-07-08', 620.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 azul 128 precintado', DATE '2026-07-07', 450.00, DATE '2026-07-08', 450.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro max morado 128 100', DATE '2026-07-08', 300.00, DATE '2026-07-10', 450.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 azul 256 precintado', DATE '2026-07-08', 620.00, DATE '2026-07-09', 720.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 blanco 256 100', DATE '2026-07-08', 570.00, DATE '2026-07-12', 670.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 plus azul 128 100', DATE '2026-07-08', 500.00, DATE '2026-07-18', 580.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro max blanco 256 91', DATE '2026-07-10', 630.00, DATE '2026-07-14', 710.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 16 pro max dorado 1 93', DATE '2026-07-10', 650.00, DATE '2026-07-12', 250.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max naranja 256 100', DATE '2026-07-11', 930.00, DATE '2026-07-16', 1120.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro max dorado 256 95', DATE '2026-07-12', 675.00, DATE '2026-07-17', 720.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro dorado 128 93', DATE '2026-07-15', 530.00, DATE '2026-07-18', 530.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 15 pro negro 128 82', DATE '2026-07-13', 250.00, DATE '2026-07-21', 410.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro natural 128 91', DATE '2026-07-16', 520.00, DATE '2026-07-21', 600.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 13 medianoche 128 84', DATE '2026-07-17', 160.00, DATE '2026-07-21', 210.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max azul 512 cerrado', DATE '2026-07-17', 990.00, DATE '2026-07-24', 1270.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 azul 256 100', DATE '2026-07-18', 600.00, DATE '2026-07-24', 600.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 negro 128 100', DATE '2026-07-18', 400.00, DATE '2026-07-24', 425.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 128 azul 86', DATE '2026-07-18', 300.00, DATE '2026-07-24', 325.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 verde 128 83', DATE '2026-07-24', 250.00, DATE '2026-07-24', 320.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro max morado 128 75', DATE '2026-07-24', 260.00, DATE '2026-07-24', 320.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 blanco 256 100%', DATE '2026-07-24', 600.00, DATE '2026-07-24', 640.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('ps5 slim disco + 2 mandos', DATE '2026-07-24', 300.00, DATE '2026-07-24', 345.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max plata 256 cerrado', DATE '2026-07-24', 1000.00, DATE '2026-07-24', 1150.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max azul 256 cerrado', DATE '2026-07-24', 1000.00, DATE '2026-07-24', 1130.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 plus azul 256 83', DATE '2026-07-24', 300.00, DATE '2026-07-24', 360.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 rosa 256 88', DATE '2026-07-25', 400.00, DATE '2026-07-25', 470.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('16 pro max', DATE '2026-07-27', 660.00, DATE '2026-07-29', 680.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('samsung s22 ultra', DATE '2026-07-29', 200.00, DATE '2026-07-31', 250.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max azul precintado 256', DATE '2026-07-30', 1050.00, DATE '2026-07-31', 1120.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro max negro 256 87%', DATE '2026-07-30', 400.00, DATE '2026-07-31', 440.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 air blanco 256 100', DATE '2026-07-31', 550.00, DATE '2026-08-01', 610.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 air negro 256 100', DATE '2026-07-31', 500.00, DATE '2026-07-31', 530.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 plus rosa 128 93', DATE '2026-07-31', 480.00, DATE '2026-07-31', 540.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 13 pro 128 negro 77', DATE '2026-07-31', 170.00, DATE '2026-07-31', 200.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('ps5 slim disco + 3 mandos', DATE '2026-07-31', 280.00, DATE '2026-08-01', 380.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 pro negro 128', DATE '2026-08-01', 380.00, DATE '2026-08-03', 440.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 15 pro blanco 128 84', DATE '2026-08-01', 400.00, DATE '2026-08-03', 440.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 13 negro', DATE '2026-08-01', 170.00, DATE '2026-08-03', 200.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 14 pro max oro 256 81', DATE '2026-08-02', 400.00, DATE '2026-08-04', 420.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 pro max naranja 256 100', DATE '2026-08-04', 950.00, DATE '2026-08-06', 1030.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max naranja 256 100', DATE '2026-08-04', 1000.00, DATE '2026-08-06', 1030.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro 128 100', DATE '2026-08-04', 300.00, DATE '2026-08-07', 400.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 16 azul 128 100', DATE '2026-08-04', 400.00, DATE '2026-08-07', 480.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 14 pro max negro 256 76', DATE '2026-08-06', 350.00, DATE '2026-08-10', 370.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max naranja 256 cerrado', DATE '2026-08-06', 1080.00, DATE '2026-08-06', 1130.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro Max 256 morado 84', DATE '2026-08-06', 390.00, DATE '2026-08-10', 430.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max naranja 256 cerrado', DATE '2026-08-06', 1000.00, DATE '2026-08-06', 1130.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 azul 256 100', DATE '2026-08-07', 560.00, DATE '2026-08-07', 650.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max azul 256 100', DATE '2026-08-07', 900.00, DATE '2026-08-07', 1000.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max azul 256 100', DATE '2026-08-07', 920.00, DATE '2026-08-07', 1080.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 plus blanco 128 91', DATE '2026-08-08', 450.00, DATE '2026-08-09', 520.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max azul 512 cerrado', DATE '2026-08-10', 1030.00, DATE '2026-08-10', 1230.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max azul 256 100', DATE '2026-08-11', 920.00, DATE '2026-08-13', 1000.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 pro naranja 256 100', DATE '2026-08-11', 800.00, DATE '2026-08-13', 850.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 15 negro 128 87', DATE '2026-08-11', 280.00, DATE '2026-08-14', 340.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('ps5 pro sellada', DATE '2026-08-11', 500.00, DATE '2026-08-12', 670.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('ps5 fat disco + monitor lg', DATE '2026-08-12', 230.00, DATE '2026-08-14', 270.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('ps5 slim digital sin mando + monitor acer', DATE '2026-08-12', 260.00, DATE '2026-08-15', 340.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 pro max plata 256 100', DATE '2026-08-12', 950.00, DATE '2026-08-15', 1000.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 negro 256 100', DATE '2026-08-12', 550.00, DATE '2026-08-12', 650.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 pro negro 256 89', DATE '2026-08-12', 400.00, DATE '2026-08-16', 460.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 blanco 256 99', DATE '2026-08-12', 590.00, DATE '2026-08-16', 640.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 pro azul cerrado', DATE '2026-08-13', 900.00, DATE '2026-08-15', 950.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 16 pro max gris 256 94', DATE '2026-08-13', 550.00, DATE '2026-08-16', 650.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro max dorado 128 85', DATE '2026-08-13', 390.00, DATE '2026-08-17', 420.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro morado 128 80', DATE '2026-08-13', 270.00, DATE '2026-08-17', 320.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro Max gris 512 cerrado', DATE '2026-08-14', 1100.00, DATE '2026-08-17', 1220.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max naranja 256', DATE '2026-08-14', 900.00, DATE '2026-08-20', 1020.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 lila 256 95', DATE '2026-08-14', 550.00, DATE '2026-08-21', 610.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max 256 gb 100', DATE '2026-08-14', 850.00, DATE '2026-08-16', 1000.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 pro max gris 256 89%', DATE '2026-08-14', 460.00, DATE '2026-08-17', 510.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 plus rosa 128 96', DATE '2026-08-17', 470.00, DATE '2026-08-17', 550.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro max negro 256 91', DATE '2026-08-17', 600.00, DATE '2026-08-21', 640.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 lila 256 99', DATE '2026-08-16', 550.00, DATE '2026-08-20', 630.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 negro 128 88', DATE '2026-08-18', 370.00, DATE '2026-08-30', 420.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('nintendo switch v1', DATE '2026-08-18', 70.00, DATE '2026-08-26', 70.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 14 pro max lila 128 81', DATE '2026-08-19', 300.00, DATE '2026-08-21', 400.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro naranja 256 cerrado', DATE '2026-08-20', 875.00, DATE '2026-08-21', 950.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 pro max negro 256 87', DATE '2026-08-20', 450.00, DATE '2026-08-21', 530.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 negro 256 100', DATE '2026-08-20', 550.00, DATE '2026-08-21', 610.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 negro 256 100', DATE '2026-08-21', 550.00, DATE '2026-08-23', 550.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro naranja 256 100', DATE '2026-08-21', 800.00, DATE '2026-08-23', 850.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 15 256 negro 74', DATE '2026-08-23', 150.00, DATE '2026-08-23', 220.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('ps5 pro precintado', DATE '2026-08-22', 600.00, DATE '2026-08-26', 670.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 e negro 128', DATE '2026-08-22', 280.00, DATE '2026-08-25', 360.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09; fecha inferida/corregida'),
  ('iphone 17 pro max naranja 256 precintado', DATE '2026-08-24', 980.00, DATE '2026-08-24', 1100.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro max desierto 256 93', DATE '2026-08-25', 600.00, DATE '2026-08-26', 680.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro Max negro 256 89', DATE '2026-08-25', 580.00, DATE '2026-08-26', 630.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro max naranja 255 cerrado', DATE '2026-08-27', 950.00, DATE '2026-08-29', 1070.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro negro 128 91', DATE '2026-08-27', 470.00, DATE '2026-08-28', 570.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('nintendo switch v2 sin caja', DATE '2026-08-27', 280.00, DATE '2026-08-31', 350.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 verde 256 100', DATE '2026-08-29', 550.00, DATE '2026-09-02', 650.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 16 pro max negro 256 93', DATE '2026-08-31', 600.00, DATE '2026-09-01', 650.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('iphone 17 pro azul 256 100', DATE '2026-08-31', 700.00, DATE '2026-08-31', 890.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i16 plus rosa 128 91 Caja no cable', DATE '2026-09-01', 430.00, DATE '2026-09-02', 550.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i16 pro max blanco 256 100', DATE '2026-09-01', 630.00, DATE '2026-09-02', 730.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i17 pro max naranja 256 cerrado', DATE '2026-09-01', 930.00, DATE '2026-09-04', 1060.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i17 pro plata 256 92', DATE '2026-09-02', 750.00, DATE '2026-09-03', 850.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i14 pro max silver 128 85', DATE '2026-09-02', 400.00, DATE '2026-09-08', 470.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('ps5 fat disco', DATE '2026-09-02', 200.00, DATE '2026-09-08', 270.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i17 negro 256 100', DATE '2026-09-03', 500.00, DATE '2026-09-05', 650.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i16 pro dorado 128 90', DATE '2026-09-02', 470.00, DATE '2026-09-04', 560.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('i17 pro naranja 256 100', DATE '2026-09-04', 700.00, DATE '2026-09-09', 850.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09'),
  ('ps5 slim disco', DATE '2026-09-08', 265.00, DATE '2026-09-08', 350.00, 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09');

DO $$
DECLARE
  v_count integer;
  v_jul_count integer;
  v_jul_revenue numeric;
  v_jul_profit numeric;
  v_aug_count integer;
  v_aug_revenue numeric;
  v_aug_profit numeric;
  v_sep_count integer;
  v_sep_revenue numeric;
  v_sep_profit numeric;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.historical_sales
  WHERE note LIKE 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09%';

  IF v_count <> 107 THEN
    RAISE EXCEPTION 'Historical import validation failed: expected 107 rows, got %', v_count;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(sale_price),0), COALESCE(SUM(gross_profit),0)
  INTO v_jul_count, v_jul_revenue, v_jul_profit
  FROM public.historical_sales
  WHERE note LIKE 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09%'
    AND sale_date >= DATE '2026-07-01'
    AND sale_date < DATE '2026-08-01';

  IF v_jul_count <> 36 OR v_jul_revenue <> 20215 OR v_jul_profit <> 2030 THEN
    RAISE EXCEPTION 'July validation failed: count %, revenue %, profit %',
      v_jul_count, v_jul_revenue, v_jul_profit;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(sale_price),0), COALESCE(SUM(gross_profit),0)
  INTO v_aug_count, v_aug_revenue, v_aug_profit
  FROM public.historical_sales
  WHERE note LIKE 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09%'
    AND sale_date >= DATE '2026-08-01'
    AND sale_date < DATE '2026-09-01';

  IF v_aug_count <> 59 OR v_aug_revenue <> 38630 OR v_aug_profit <> 4495 THEN
    RAISE EXCEPTION 'August validation failed: count %, revenue %, profit %',
      v_aug_count, v_aug_revenue, v_aug_profit;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(sale_price),0), COALESCE(SUM(gross_profit),0)
  INTO v_sep_count, v_sep_revenue, v_sep_profit
  FROM public.historical_sales
  WHERE note LIKE 'Importación histórica inicial KevPhonesGC 2026-07-01/2026-09-09%'
    AND sale_date >= DATE '2026-09-01'
    AND sale_date <= DATE '2026-09-09';

  IF v_sep_count <> 12 OR v_sep_revenue <> 7640 OR v_sep_profit <> 1215 THEN
    RAISE EXCEPTION 'September validation failed: count %, revenue %, profit %',
      v_sep_count, v_sep_revenue, v_sep_profit;
  END IF;
END $$;

COMMIT;
