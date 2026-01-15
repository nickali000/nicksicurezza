def get_ipsec_structure(protocol, mode):
    """
    Returns the structural layout of an IPsec packet based on Protocol (AH/ESP) and Mode (Transport/Tunnel).
    Used to drive the frontend visualization.
    """
    structure = []
    
    # Common Original Packet Parts
    orig_ip = {"type": "header-ip", "label": "IP Header Originale", "desc": "IP Src/Dst Originali"}
    tcp_udp = {"type": "header-transport", "label": "TCP/UDP", "desc": "Porte"}
    data = {"type": "payload", "label": "Dati (Payload)", "desc": "Messaggio"}
    
    if mode == 'transport':
        # Transport Mode: Insert header between IP and TCP
        structure.append(orig_ip)
        
        if protocol == 'ah':
            # [ IP | AH | TCP | Data ]
            structure.append({"type": "header-ah", "label": "AH Header", "desc": "Autenticazione (SPI, Seq, ICV)"})
            structure.append(tcp_udp)
            structure.append(data)
            
        elif protocol == 'esp':
            # [ IP | ESP_H | TCP | Data | ESP_T | ESP_A ]
            structure.append({"type": "header-esp-head", "label": "ESP Header", "desc": "SPI, SeqNum"})
            
            # Encrypted part start
            structure.append({"type": "marker-enc-start", "label": "Inizio Cifratura"})
            structure.append(tcp_udp)
            structure.append(data)
            structure.append({"type": "header-esp-trail", "label": "ESP Trailer", "desc": "Padding, NextHeader"})
            structure.append({"type": "marker-enc-end", "label": "Fine Cifratura"})
            
            structure.append({"type": "header-esp-auth", "label": "ESP Auth", "desc": "ICV (Firma)"})

    elif mode == 'tunnel':
        # Tunnel Mode: Wrap everything in New IP
        
        new_ip = {"type": "header-ip-new", "label": "Nuovo IP Header", "desc": "Gateway-to-Gateway IP"}
        structure.append(new_ip)
        
        if protocol == 'ah':
            # [ NewIP | AH | OrigIP | TCP | Data ]
            structure.append({"type": "header-ah", "label": "AH Header", "desc": "Autenticazione"})
            structure.append(orig_ip)
            structure.append(tcp_udp)
            structure.append(data)
            
        elif protocol == 'esp':
            # [ NewIP | ESP_H | OrigIP | TCP | Data | ESP_T | ESP_A ]
            structure.append({"type": "header-esp-head", "label": "ESP Header", "desc": "SPI, SeqNum"})
            
            # Encrypted Part
            structure.append({"type": "marker-enc-start", "label": "Inizio Cifratura"})
            structure.append(orig_ip)
            structure.append(tcp_udp)
            structure.append(data)
            structure.append({"type": "header-esp-trail", "label": "ESP Trailer", "desc": "Padding"})
            structure.append({"type": "marker-enc-end", "label": "Fine Cifratura"})
            
            structure.append({"type": "header-esp-auth", "label": "ESP Auth", "desc": "ICV"})
            
    return structure
