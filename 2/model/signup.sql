CREATE TABLE SIGNUP
(
CustomerID int NOT NULL,
BVN bigint,
Name varchar(255),
Email varchar(255),
Phone varchar(255),
Password varchar(255),
DoC DATE,
Primary Key(CustomerID)
);

INSERT INTO SIGNUP (CUSTOMERID, BVN, NAME, EMAIL, PHONE, PASSWORD, DOC) VALUES (1, 22182780033, 'Akinlabi Ajelabi', 'akinlabiajelabi@me.com', '08087656435', 'Dinosaurs', DATE ('2017-05-11'));
