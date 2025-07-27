package main

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type Property struct {
	SerialNumber int64   `json:"serial_number"`
	Town         string  `json:"town"`
	SaleAmount   float64 `json:"sale_amount"`
	PropertyType string  `json:"property_type"`
}

type TownAnalytics struct {
	Town         string  `json:"town"`
	AveragePrice float64 `json:"average_price"`
}

func main() {
	connStr := "postgresql://user_urbanytics:password_urbanytics@localhost:5432/db_urbanytics"

	conn, err := pgx.Connect(context.Background(), connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	fmt.Println("Successfully connected to the database!")

	router := gin.Default()

	router.Use(cors.Default())

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// ENDPOINT PARA OBTENER UNA PROPIEDAD POR ID
	router.GET("/properties/:id", func(c *gin.Context) {
		idParam := c.Param("id")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid ID format"})
			return
		}

		var p Property
		err = conn.QueryRow(context.Background(), "SELECT serial_number, town, sale_amount, property_type FROM properties WHERE serial_number = $1", id).Scan(&p.SerialNumber, &p.Town, &p.SaleAmount, &p.PropertyType)

		if err != nil {
			if err == pgx.ErrNoRows {
				c.JSON(404, gin.H{"error": "Property not found"})
				return
			}
			c.JSON(500, gin.H{"error": "Internal server error"})
			return
		}

		c.JSON(200, p)
	})

	// ENDPOINT PARA LISTAR PROPIEDADES (CON FILTROS Y PAGINACIÓN)
	router.GET("/properties", func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		offset := (page - 1) * limit
		town := c.Query("town")

		baseQuery := "SELECT serial_number, town, sale_amount, property_type FROM properties"
		var conditions []string
		var args []interface{}
		argId := 1

		if town != "" {
			conditions = append(conditions, fmt.Sprintf("town = $%d", argId))
			args = append(args, town)
			argId++
		}

		whereClause := ""
		if len(conditions) > 0 {
			whereClause = " WHERE " + strings.Join(conditions, " AND ")
		}

		finalQuery := fmt.Sprintf("%s%s ORDER BY serial_number LIMIT $%d OFFSET $%d", baseQuery, whereClause, argId, argId+1)
		args = append(args, limit, offset)

		properties := []Property{}
		rows, err := conn.Query(context.Background(), finalQuery, args...)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query properties", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var p Property
			err := rows.Scan(&p.SerialNumber, &p.Town, &p.SaleAmount, &p.PropertyType)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan property"})
				return
			}
			properties = append(properties, p)
		}

		c.JSON(200, properties)
	})

	// ENDPOINT PARA CREAR UNA PROPIEDAD
	router.POST("/properties", func(c *gin.Context) {
		var newProperty Property

		// Vincula el JSON del cuerpo de la petición a la estructura newProperty.
		if err := c.BindJSON(&newProperty); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}

		// Inserta la nueva propiedad en la base de datos.
		sql := "INSERT INTO properties (serial_number, town, sale_amount, property_type) VALUES ($1, $2, $3, $4)"
		_, err := conn.Exec(context.Background(), sql, newProperty.SerialNumber, newProperty.Town, newProperty.SaleAmount, newProperty.PropertyType)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create property", "details": err.Error()})
			return
		}

		// Devuelve la propiedad creada con un estado 201 (Created).
		c.JSON(201, newProperty)
	})
	// ENDPOINT PARA ACTUALIZAR UNA PROPIEDAD
	router.PUT("/properties/:id", func(c *gin.Context) {
		idParam := c.Param("id")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid ID format"})
			return
		}

		var updatedProperty Property
		if err := c.BindJSON(&updatedProperty); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request body"})
			return
		}

		// El ID en el cuerpo debe coincidir con el ID en la URL.
		updatedProperty.SerialNumber = id

		sql := "UPDATE properties SET town = $1, sale_amount = $2, property_type = $3 WHERE serial_number = $4"
		tag, err := conn.Exec(context.Background(), sql, updatedProperty.Town, updatedProperty.SaleAmount, updatedProperty.PropertyType, id)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to update property", "details": err.Error()})
			return
		}

		// Si ninguna fila fue afectada, significa que el ID no existía.
		if tag.RowsAffected() == 0 {
			c.JSON(404, gin.H{"error": "Property not found"})
			return
		}

		c.JSON(200, updatedProperty)
	})
	// ENDPOINT PARA BORRAR UNA PROPIEDAD
	router.DELETE("/properties/:id", func(c *gin.Context) {
		idParam := c.Param("id")
		id, err := strconv.ParseInt(idParam, 10, 64)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid ID format"})
			return
		}

		sql := "DELETE FROM properties WHERE serial_number = $1"
		tag, err := conn.Exec(context.Background(), sql, id)

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to delete property", "details": err.Error()})
			return
		}

		if tag.RowsAffected() == 0 {
			c.JSON(404, gin.H{"error": "Property not found"})
			return
		}

		c.JSON(200, gin.H{"message": "Property deleted successfully"})
	})

	// ENDPOINT PARA DATOS DE ANALÍTICAS
	router.GET("/analytics/avg-price-by-town", func(c *gin.Context) {
		analyticsData := []TownAnalytics{}
		sql := "SELECT town, AVG(sale_amount) as average_price FROM properties GROUP BY town ORDER BY town"

		rows, err := conn.Query(context.Background(), sql)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to query analytics"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var data TownAnalytics
			err := rows.Scan(&data.Town, &data.AveragePrice)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to scan analytics data"})
				return
			}
			analyticsData = append(analyticsData, data)
		}

		c.JSON(200, analyticsData)
	})
	router.Run(":8080")
}
