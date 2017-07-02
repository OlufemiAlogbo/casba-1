CREATE TABLE LOCATION (
  ID int NOT NULL,
  latitude decimal,
  longitude decimal,
  ToC TIMESTAMP,
  Primary Key(ID)
);

INSERT INTO LOCATION (ID, LATITUDE, LONGITUDE) VALUES (1, 6.465422, 3.406448);
