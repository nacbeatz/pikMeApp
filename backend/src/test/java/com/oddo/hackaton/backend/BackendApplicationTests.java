package com.oddo.hackaton.backend;

import com.oddo.hackaton.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;

import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertNotNull;


@SpringBootTest
class BackendApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DataSource dataSource;

    @Test
    void contextLoads()
    {
        assertNotNull(userRepository);
    }

    @Test
    void testDatabaseConnection() throws Exception
    {
        try (Connection connection = dataSource.getConnection())
        {
            assertNotNull(connection);
            System.out.println("✅ Database connected successfully!");
            System.out.println("📊 Database URL: " + connection.getMetaData().getURL());
        }
    }

}
